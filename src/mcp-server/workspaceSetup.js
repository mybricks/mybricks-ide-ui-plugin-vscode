/**
 * 开启 MCP 时按需设置工作区：写入 mcp.json，并调用 skills 的 setup（复制 Skill、确保目录）
 * 仅在被「开启 MCP 服务」命令调用时执行
 */
const vscode = require('vscode')
const path = require('path')
const fs = require('fs')
const { setupSkill: setupSkillFromSkills, getIDEDir } = require('../skills')

/**
 * 在工作区 ideDir 下写入/合并 mcp.json，配置 mybricks-mcp 的 url
 */
async function setupMCPConfig(context, serverUrl) {
  try {
    const ideDir = getIDEDir(context)
    if (!fs.existsSync(ideDir)) {
      fs.mkdirSync(ideDir, { recursive: true })
    }
    const mcpConfigPath = path.join(ideDir, 'mcp.json')
    let mcpConfig = {}
    if (fs.existsSync(mcpConfigPath)) {
      const content = fs.readFileSync(mcpConfigPath, 'utf8')
      try {
        mcpConfig = JSON.parse(content)
      } catch (error) {
        console.warn('[MyBricks] mcp.json 格式不正确，将重新创建:', error.message)
      }
    }
    if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {}
    mcpConfig.mcpServers['mybricks-mcp'] = { url: serverUrl }
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2), 'utf8')
    console.log(`[MyBricks] 成功配置 MCP 服务器 URL: ${serverUrl}`)
    return true
  } catch (error) {
    console.error('[MyBricks] 配置 MCP 时出错:', error)
    vscode.window.showErrorMessage('[MyBricks] 配置 MCP 失败: ' + error.message)
    return false
  }
}

/**
 * 为 MCP 设置工作区：先执行 Skill setup（确保目录 + 复制），再写入 mcp.json
 * 仅在「开启 MCP 服务」时按需调用
 */
async function setupMCPWorkspace(context, serverUrl) {
  try {
    const skillSuccess = await setupSkillFromSkills(context)
    if (!skillSuccess) return false
    const mcpSuccess = await setupMCPConfig(context, serverUrl)
    if (!mcpSuccess) {
      console.warn('[MyBricks] MCP 配置失败，但 skill 已安装成功')
    }
    return true
  } catch (error) {
    console.error('[MyBricks] 设置 MCP 工作区时出错:', error)
    vscode.window.showErrorMessage('[MyBricks] 设置 MCP 工作区失败: ' + error.message)
    return false
  }
}

module.exports = {
  setupMCPWorkspace,
}
