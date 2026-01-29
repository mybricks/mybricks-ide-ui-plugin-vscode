const vscode = require('vscode')
const { WebviewView } = require('./renderer')
const { initMybricksEnvironment } = require('./init')
const { getServerUrl } = require('./mcp-server')
const { getInstance: getWebviewManager } = require('./manager/webviewManager')

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

  // 注册命令：打开 MyBricks 设计器
  const openWebCommand = vscode.commands.registerCommand(
    'mybricks.openIDE',
    async () => {
      return webviewManager.ensurePanel()
    }
  )

  // 注册命令：初始化 MyBricks 环境（安装 Skill 并配置 MCP）
  const initCommand = vscode.commands.registerCommand(
    'mybricks.init',
    async () => {
      const serverUrl = getServerUrl()
      await initMybricksEnvironment(context, serverUrl)
    }
  )

  // 注册侧边栏视图提供者
  const provider = webviewView.createProvider(context)
  const webviewViewProvider = vscode.window.registerWebviewViewProvider(
    'mybricks.ide',
    provider
  )

  // 将所有订阅添加到 context.subscriptions
  context.subscriptions.push(openWebCommand)
  context.subscriptions.push(initCommand)
  context.subscriptions.push(webviewViewProvider)
}

module.exports = {
  registerSubscriptions,
}

