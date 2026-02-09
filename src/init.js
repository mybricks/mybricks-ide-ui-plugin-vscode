/**
 * MyBricks 初始化命令：仅作提示，不创建目录、不操作 Skill/MCP
 * IDE 目录与 skills 目录由 MCP / Skill 的 setup 在「开启 MCP 服务」时按需创建
 */
const vscode = require('vscode')

/**
 * 执行初始化（仅提示）
 * @param {vscode.ExtensionContext} context
 */
function runInit(context) {
  vscode.window.showInformationMessage(
    '[MyBricks] 已就绪。如需使用 AI 能力，请在命令面板中执行「开启 MCP 服务」。'
  )
}

module.exports = {
  runInit,
}
