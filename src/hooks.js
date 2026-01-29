const vscode = require('vscode')
const { registerSubscriptions } = require('./subscriptions')
const { isMybricksProject } = require('../utils/utils')
const {
  startMCPHttpServer,
  stopMCPHttpServer,
  getServerUrl,
} = require('./mcp-server')
const { initMybricksEnvironment } = require('./init')

/**
 * 插件激活时的生命周期钩子
 * @param {vscode.ExtensionContext} context - 扩展上下文
 */
function onActivate(context) {
  // 注册所有订阅（命令、视图等）
  registerSubscriptions(context)

  // 启动 MCP HTTP 服务器
  startMCPHttpServer(context)
  const serverUrl = getServerUrl()
  console.log(`[MyBricks] MCP Server URL: ${serverUrl}`)

  // 检查是否是 mybricks 项目，如果是则自动初始化环境
  if (isMybricksProject(context)) {
    setTimeout(() => {
      // 获取当前 MCP 服务器 URL（支持动态 IP）
      const serverUrl = getServerUrl()
      
      // 自动初始化 MyBricks 环境（安装 skill 并配置 MCP）
      initMybricksEnvironment(context, serverUrl).catch((error) => {
        console.error('[MyBricks] 自动初始化环境时出错:', error)
      })

      // 启动时自动打开设计器
      vscode.commands.executeCommand('mybricks.openIDE')
    }, 100)
  }

  // 如果是调试前端模式，自动打开 IDE 和开发者工具
  if (process.env.MYBRICKS_FRONT_END_DEBUG_MODE === 'true') {
    setTimeout(() => {
      vscode.commands.executeCommand('mybricks.openIDE')
      // 延迟打开开发者工具，等待 webview 创建完成
      setTimeout(() => {
        vscode.commands.executeCommand('workbench.action.webview.openDeveloperTools')
      }, 500)
    }, 500)
  }
  // vscode.commands.executeCommand('mybricks.openIDE')
}

/**
 * 插件停用时的生命周期钩子
 */
function onDeactivate() {
  // 停止 MCP HTTP 服务器
  stopMCPHttpServer()

  // 清理资源
  // 可以在这里添加清理逻辑，如关闭面板、释放资源等
}

module.exports = {
  onActivate,
  onDeactivate,
}

