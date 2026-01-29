const http = require('http')
const vscode = require('vscode')
const fs = require('fs')
const path = require('path')
const z = require('zod/v4')
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js')
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js')
const { getUserRequireGuide, getComponentDocs } = require('./prompt')
const { getInstance: getWebviewManager } = require('../manager/webviewManager')

let server = null
let mcpServer = null
let transport = null
let serverPort = 3001
let extensionContext = null

/**
 * 启动 MCP HTTP 服务器（使用 Streamable HTTP 传输）
 * @param {vscode.ExtensionContext} context - 扩展上下文
 * @param {number} port - 服务器端口，默认 3001
 */
async function startMCPHttpServer(context, port = 3001) {
  // 保存扩展上下文，供其他函数使用
  extensionContext = context

  // 从配置中读取端口
  const config = vscode.workspace.getConfiguration('mybricks')
  const configuredPort = config.get('mcp.port', port)
  serverPort = configuredPort

  // 如果服务器已启动，先关闭
  if (server) {
    stopMCPHttpServer()
  }

  // 创建 MCP 服务器实例（使用高级 API）
  mcpServer = new McpServer(
    {
      name: 'mybricks-vscode-mcp',
      version: '0.0.9',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  )

  // 注册资源、提示和工具
  registerResources(mcpServer, context)
  // registerPrompts(mcpServer, context)
  await registerTools(mcpServer, context)

  // 创建 Streamable HTTP 传输
  transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => {
      // 使用随机 UUID 生成会话 ID（stateful 模式）
      const { randomUUID } = require('crypto')
      return randomUUID()
    },
  })

  // 连接服务器和传输（McpServer 的 connect 是异步的）
  mcpServer.connect(transport).catch((error) => {
    console.error('[MCP Server] Connection error:', error)
  })

  // 创建 HTTP 服务器
  server = http.createServer(async (req, res) => {
    // 处理健康检查端点
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', port: serverPort }))
      return
    }

    // 处理 MCP 请求（所有其他请求都转发给 transport）
    try {
      await transport.handleRequest(req, res)
    } catch (error) {
      console.error('[MCP Server] Request handling error:', error)
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: error.message }))
      }
    }
  })

  // 处理服务器错误
  server.on('error', async (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `[MCP Server] Port ${serverPort} is already in use. Trying next port...`
      )
      // 尝试下一个端口
      serverPort += 1
      await startMCPHttpServer(context, serverPort)
    } else {
      console.error('[MCP Server] Server error:', error)
    }
  })

  // 启动服务器
  server.listen(serverPort, 'localhost', () => {
    console.log(
      `[MCP Server] HTTP server running on http://localhost:${serverPort}`
    )
    vscode.window.showInformationMessage(
      `MyBricks MCP Server started on port ${serverPort}`
    )
  })

  return server
}

/**
 * 注册 MCP 资源
 * @param {McpServer} server - MCP 服务器实例
 * @param {vscode.ExtensionContext} context - 扩展上下文
 */
function registerResources(server, context) {
  // 资源注册预留
}

/**
 * 注册 MCP 提示模板
 * @param {McpServer} server - MCP 服务器实例
 * @param {vscode.ExtensionContext} context - 扩展上下文
 */
function registerPrompts(server, context) {
  // 注册 generate-ui-guide Prompt
  // 注意：这是一个 Prompt 模板，客户端可以通过 prompts/get 获取
  // 返回的 messages 会被插入到对话中，用于指导 AI 如何生成 actions 序列
  server.registerPrompt(
    'get-generate-ui-guide',
    {
      title: 'Get Generate UI Guide',
      description: `生成 MyBricks UI 的完整教程指南 Prompt 模板。

这是一个 Prompt 模板，用于获取生成 MyBricks UI 的完整指南，包含：
- actions 字符串的构建规则
- UI 搭建规则和最佳实践
- 组件定位和布局原则
- 各种 action 类型（setLayout、doConfig、addChild、delete）的详细说明

使用方法：
1. 调用 prompts/get 获取此 prompt 模板
2. 传入用户需求作为参数
3. 返回的 messages 会包含完整的指南内容，用于指导后续的 UI 生成

在调用 generate-ui 工具之前，建议先使用此 prompt 获取格式指南。`,
      argsSchema: {
        userRequirement: z.string().describe('用户的UI生成需求描述，将用于生成个性化的指南内容')
      }
    },
    async ({ userRequirement }) => {
      const guideText = getUserRequireGuide(userRequirement)
      
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: guideText
            }
          }
        ]
      }
    }
  )
}

/**
 * 检查 Webview 是否已初始化
 * @returns {Object|null} 如果初始化返回 null，未初始化返回错误响应
 */
function checkWebviewInitialized() {
  const webviewManager = getWebviewManager()
  if (!webviewManager.isReady()) {
    return {
      content: [
        {
          type: 'text',
          text: '检测到设计器未打开。请先调用 open-mybricks-editor 工具来打开设计器。'
        }
      ]
    }
  }
  return null
}

/**
 * 获取 Webview 实例（用于访问 MyBricksAPI）
 * @returns {Object} 包含 MyBricksAPI 的 webview 对象
 */
function getWebviewPanelInstance() {
  const webviewManager = getWebviewManager()
  const panel = webviewManager.getPanel()
  if (!panel) {
    throw new Error('Webview 未初始化')
  }
  // 返回 webview 对象，它包含 MyBricksAPI 代理
  return panel.webview
}

/**
 * 获取所有可用的组件定义（用于工具描述）
 * @returns {Promise<string>} 组件定义的原始字符串
 */
async function getAvailableComponentNamespaces() {
  try {
    const webview = getWebviewPanelInstance()
    const allComDefPrompts = await webview.MyBricksAPI.getAllComDefPrompts()
    return typeof allComDefPrompts === 'string' ? allComDefPrompts : ''
  } catch (error) {
    console.error('[MCP Server] 获取组件列表失败:', error)
    return `注意：获取组件列表失败: ${error.message}。请确保设计器已打开并完全加载。`
  }
}

/**
 * 注册 MCP 工具（使用官方推荐的 registerTool API）
 * @param {McpServer} server - MCP 服务器实例
 * @param {vscode.ExtensionContext} context - 扩展上下文
 */
async function registerTools(server, context) {
  const webviewManager = getWebviewManager()

  // 注册打开 MyBricks IDE 工具
  server.registerTool(
    'open-mybricks-editor',
    {
      title: 'Open MyBricks Editor',
      description: '打开 MyBricks 设计器。如果设计器未打开或未初始化，调用此工具来启动它。此工具会等待设计器完全加载后才返回。',
      inputSchema: {}
    },
    async () => {
      // 如果已经打开，直接返回
      if (webviewManager.isReady()) {
        return {
          content: [
            {
              type: 'text',
              text: '设计器已打开并准备就绪。'
            }
          ]
        }
      }

      try {
        // 调用 ensurePanel 自动打开面板并等待初始化完成
        await webviewManager.ensurePanel()

        return {
          content: [
            {
              type: 'text',
              text: '设计器已打开并完全加载。'
            }
          ]
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `打开设计器失败: ${error.message}`
            }
          ]
        }
      }
    }
  )

  // // 注册编辑器状态查询工具
  // server.registerTool(
  //   'get-editor-state',
  //   {
  //     title: 'Get Editor State',
  //     description: '获取设计器的当前状态，包括是否打开、是否准备就绪等。',
  //     inputSchema: {}
  //   },
  //   async () => {
  //     const isOpen = webviewManager.isReady()
  //     const state = {
  //       isOpen,
  //       readiness: isOpen ? 'ready' : 'not-opened',
  //       timestamp: new Date().toISOString()
  //     }
      
  //     return {
  //       content: [
  //         {
  //           type: 'text',
  //           text: JSON.stringify(state, null, 2)
  //         }
  //       ]
  //     }
  //   }
  // )

  // 注册获取当前聚焦元素信息的工具
  server.registerTool(
    'get-project-info',
    {
      title: 'Get Project Info',
      description: '获取当前项目信息，包含所有页面文件 和 选中/聚焦的元素的详细信息（组件ID、页面ID、元素类型、元素标题等）',
      inputSchema: {}
    },
    async () => {
      const checkResult = checkWebviewInitialized()
      if (checkResult) return checkResult

      try {
        const messageAPI = webviewManager.getMessageAPI()
        const focusInfo = await messageAPI.callWebview('getFocusElementInfo')
        const webview = getWebviewPanelInstance()
        const pagesInfo = await webview.MyBricksAPI.getPagesInfo()

        const resultText = `#项目信息 \n${pagesInfo} \n # 当前聚焦元素信息\n${focusInfo ? JSON.stringify(focusInfo, null, 2) : '当前没有聚焦的元素'}`
        return {
          content: [
            {
              type: 'text',
              text: resultText
            }
          ]
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `获取项目信息失败: ${error.message}`
            }
          ]
        }
      }
    }
  )

  // 注册获取可用组件列表的工具
  server.registerTool(
    'get-available-components',
    {
      title: 'Get Available Components',
      description: '获取设计器中可用的所有组件列表摘要。生成 UI 时需要先获取摘要，再根据摘要获取具体的组件配置文档。',
      inputSchema: {}
    },
    async () => {
      const checkResult = checkWebviewInitialized()
      if (checkResult) return checkResult

      try {
        const componentsInfo = await getAvailableComponentNamespaces()
        return {
          content: [
            {
              type: 'text',
              text: componentsInfo || '未找到可用组件'
            }
          ]
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `获取组件列表失败: ${error.message}`
            }
          ]
        }
      }
    }
  )

  // 注册获取组件文档的工具
  server.registerTool(
    'get-component-docs',
    {
      title: 'Get Component Docs',
      description: '根据组件 namespace 获取详细的组件配置文档。支持批量获取多个组件的文档。生成 UI 时必须先获取组件文档才能构建 UI。',
      inputSchema: {
        namespaces: z.array(z.string()).describe('组件 namespace 数组')
      }
    },
    async ({ namespaces }) => {
      if (!namespaces || !Array.isArray(namespaces) || namespaces.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'namespaces 必须是非空数组'
            }
          ]
        }
      }

      const checkResult = checkWebviewInitialized()
      if (checkResult) return checkResult

      try {
        const webview = getWebviewPanelInstance()
        const results = await Promise.all(namespaces.map(ns => webview.MyBricksAPI.getComEditorPrompts(ns)))
        
        let resultText = `# 组件文档\n\n`
        resultText += `共获取 ${Object.keys(results).length} 个组件的文档：\n\n`

        results.forEach(docString => {
          resultText += docString + '\n\n'
        })
     
        return {
          content: [
            {
              type: 'text',
              text: resultText
            }
          ]
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `获取组件文档失败: ${error.message}`
            }
          ]
        }
      }
    }
  )

  // 注册 generate-ui-guide 工具
  server.registerTool(
    'generate-ui-guide',
    {
      title: 'Generate UI Guide',
      description: '获取 MyBricks UI 生成指南，包含 actions 序列的构建规则、UI 搭建规则和最佳实践、组件定位和布局原则等。建议在调用 generate-ui 工具前先使用此工具。',
    },
    async () => {
      const guideText = getUserRequireGuide()
      
      return {
        content: [
          {
            type: 'text',
            text: guideText
          }
        ]
      }
    }
  )

  server.registerTool(
    'generate-ui-start',
    {
      title: 'Generate UI Start',
      description: '标记开始生成 UI，生成UI有多个步骤，需要先标记开始，才能进行 generate-ui 工具的调用',
      inputSchema: {
        pageId: z.string().describe('页面的 ID，用于标识要生成的页面')
      }
    },
    async ({ pageId }) => {
      const checkResult = checkWebviewInitialized()
      if (checkResult) return checkResult

      const webview = getWebviewPanelInstance()
      await webview.MyBricksAPI.createPageOperator(pageId)

      return {
        content: [
          {
            type: 'text',
            text: `事务已开始，请调用 generate-ui 工具进行生成`
          }
        ]
      }
    }
  )

  // 注册 generate-ui 工具
  server.registerTool(
    'generate-ui',
    {
      title: 'Generate UI',
      description: '根据用户需求，结合组件配置文档和搭建指南，生成 MyBricks UI 内容。必须先了解组件文档和搭建指南才能正确生成 UI。',
      inputSchema: {
        pageId: z.string().describe('目标页面的ID'),
        actionsString: z.string().describe('生成UI的 actions 字符串，注意一行一个action')
      }
    },
    async ({ pageId, actionsString }) => {
      const checkResult = checkWebviewInitialized()
      if (checkResult) return checkResult

      const webview = getWebviewPanelInstance()
      await webview.MyBricksAPI.updatePageOperator(pageId, actionsString)

      return {
        content: [
          { type: 'text', text: `当前部分内容已生成，请继续下一步` }
        ]
      }
    }
  )

  server.registerTool(
    'generate-ui-complete',
    {
      title: 'Generate UI Complete',
      description: '标记完成生成 UI，生成UI有多个步骤，generate-ui 工具调用完成后，需要调用此工具标记完成',
      inputSchema: {
        pageId: z.string().describe('页面的 ID，用于标识生成完成的页面')
      }
    },
    async ({ pageId }) => {
      const checkResult = checkWebviewInitialized()
      if (checkResult) return checkResult

      const webview = getWebviewPanelInstance()
      await webview.MyBricksAPI.completePageOperator(pageId)

      return {
        content: [
          { type: 'text', text: `生成UI完成，事务已结束，如需其他操作，请继续。` }
        ]
      }
    }
  )

  server.registerTool(
    'get-page-content',
    {
      title: 'Get Page Content',
      description: '获取页面的内容，包括页面的和所有子组件的内容',
      inputSchema: {
        pageId: z.string().describe('页面的 ID，用于标识要获取的页面')
      }
    },
    async ({ pageId }) => {
      const webview = getWebviewPanelInstance()
      const pageContent = await webview.MyBricksAPI.getPageContent(pageId)
      return {
        content: [
          { type: 'text', text: pageContent }
        ]
      }
    }
  )  
}

/**
 * 停止 MCP HTTP 服务器
 */
async function stopMCPHttpServer() {
  if (transport) {
    await transport.close()
    transport = null
  }

  if (mcpServer) {
    // McpServer 的 close 方法是异步的
    await mcpServer.close()
    mcpServer = null
  }

  if (server) {
    return new Promise((resolve) => {
      server.close(() => {
        console.log('[MCP Server] HTTP server stopped')
        server = null
        resolve()
      })
    })
  }
}

/**
 * 获取当前服务器端口
 */
function getServerPort() {
  return serverPort
}

/**
 * 获取服务器URL
 */
function getServerUrl() {
  return `http://localhost:${serverPort}`
}

module.exports = {
  startMCPHttpServer,
  stopMCPHttpServer,
  getServerPort,
  getServerUrl,
}
