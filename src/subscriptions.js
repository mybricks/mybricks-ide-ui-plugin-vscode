const vscode = require('vscode')
const { WebviewView } = require('./renderer')
const { runInit } = require('./init')
const {
  getServerUrl,
  getServerPort,
  startMCPHttpServer,
  isMCPServerRunning,
  setupMCPWorkspace,
} = require('./mcp-server')
const { getInstance: getWebviewManager } = require('./manager/webviewManager')
const { registerCustomEditor } = require('./customEditor')

// WebviewView 侧边栏视图实例
const webviewView = new WebviewView()

/**
 * 注册所有订阅（命令、视图等）
 * @param {vscode.ExtensionContext} context - 扩展上下文
 */
function registerSubscriptions(context) {
  // 获取 WebviewManager 单例并初始化
  const webviewManager = getWebviewManager()
  webviewManager.initialize(context)

  // 注册命令：打开 MyBricks 设计器（若存在由 vscode:// URI 传入的 path 则打开该文件）
  const openWebCommand = vscode.commands.registerCommand(
    'mybricks.openIDE',
    async () => {
      const pendingPath = webviewManager.takePendingFilePathFromUri()
      webviewManager.setCurrentFilePath(pendingPath ?? null)
      return webviewManager.ensurePanel()
    }
  )

  // 注册命令：初始化 MyBricks 环境（仅提示，目录与 Skill/MCP 由「开启 MCP 服务」按需处理）
  const initCommand = vscode.commands.registerCommand(
    'mybricks.init',
    async () => {
      runInit(context)
    }
  )

  // 注册命令：开启 MCP 服务（仅在此处按需移动 skill 与 MCP 配置，再设置 enabled、启动服务）
  const enableMCPCommand = vscode.commands.registerCommand(
    'mybricks.enableMCPService',
    async () => {
      // 1. 若 MCP 服务未启动则先启动（以便 getServerUrl() 有有效端口）
      if (!isMCPServerRunning()) {
        await startMCPHttpServer(context)
      }
      const serverUrl = getServerUrl()

      // 2. 打开 MCP 配置时按需执行：复制 skill 到工作区、写入 mcp.json
      await setupMCPWorkspace(context, serverUrl)

      // 3. 将「是否开启 MCP」配置设为 true
      await vscode.workspace.getConfiguration('mybricks').update('mcp.enabled', true, vscode.ConfigurationTarget.Global)

      // 4. 若设计器未打开则先打开设计器
      const panel = webviewManager.getPanel()
      if (!panel) {
        await webviewManager.ensurePanel()
      }

      // 5. 通知前端 setting 已更新（前端统一从 setting 读取并监听）
      const messageApi = webviewManager.getMessageAPI()
      if (messageApi?.notifyWebview) {
        messageApi.notifyWebview('mcpSettingChanged', { enabled: true })
        messageApi.notifyWebview('mcpEnabled', { port: getServerPort() })
      }
      vscode.window.showInformationMessage('MCP 服务已开启。')
    }
  )

  // 监听「是否开启 MCP」配置变化，通知已打开的设计器
  const configChangeDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
    if (!e.affectsConfiguration('mybricks.mcp.enabled')) return
    const messageApi = webviewManager.getMessageAPI()
    if (messageApi?.notifyWebview) {
      const enabled = vscode.workspace.getConfiguration('mybricks').get('mcp.enabled') === true
      messageApi.notifyWebview('mcpSettingChanged', { enabled })
    }
  })

  // 注册侧边栏视图提供者
  const provider = webviewView.createProvider(context)
  const webviewViewProvider = vscode.window.registerWebviewViewProvider(
    'mybricks.ide',
    provider
  )

  // 注册自定义编辑器（用于打开 .mybricks 文件）
  registerCustomEditor(context)

  // 将所有订阅添加到 context.subscriptions
  context.subscriptions.push(openWebCommand)
  context.subscriptions.push(initCommand)
  context.subscriptions.push(enableMCPCommand)
  context.subscriptions.push(configChangeDisposable)
  context.subscriptions.push(webviewViewProvider)
}

module.exports = {
  registerSubscriptions,
}

