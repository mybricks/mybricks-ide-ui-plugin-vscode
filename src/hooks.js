const vscode = require('vscode')
const { registerSubscriptions } = require('./subscriptions')
const { stopMCPHttpServer } = require('./mcp-server')

/**
 * 插件激活时的生命周期钩子
 * @param {vscode.ExtensionContext} context - 扩展上下文
 */
function onActivate(context) {
  // 注册所有订阅（命令、视图等）
  registerSubscriptions(context)

  // MCP 服务不在此处启动，需打开设计器后通过命令「开启 MCP 服务」触发
  // 不再默认打开 MyBricks 设计器，用户通过命令或打开 .mybricks 文件进入

  // 调试前端时自动打开开发者工具（需先手动打开设计器）
  if (process.env.MYBRICKS_FRONT_END_DEBUG_MODE === 'true') {
    setTimeout(() => {
      vscode.commands.executeCommand('workbench.action.webview.openDeveloperTools')
    }, 1000)
  }
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

