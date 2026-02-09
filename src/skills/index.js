/**
 * Skill 设置：确保 IDE/skills 目录存在并复制 mybricks-assistant 到工作区
 * 仅在「开启 MCP 服务」时由 MCP 流程按需调用
 */
const vscode = require('vscode')
const path = require('path')
const fs = require('fs')
const { getWorkspaceFolder, getTargetIDEDir } = require('../../utils/utils')

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

/**
 * 获取工作区 IDE 目录
 */
function getIDEDir(context) {
  const workspaceFolder = getWorkspaceFolder(context)
  const projectRoot = workspaceFolder ? workspaceFolder.fsPath : context.extensionPath
  return getTargetIDEDir(projectRoot)
}

/**
 * 设置 Skill：确保 ide 目录与 skills 目录存在，复制 mybricks-assistant 到工作区
 * @param {vscode.ExtensionContext} context
 */
async function setupSkill(context) {
  try {
    const ideDir = getIDEDir(context)
    if (!fs.existsSync(ideDir)) {
      fs.mkdirSync(ideDir, { recursive: true })
      console.log(`[MyBricks] 创建 ${path.basename(ideDir)} 目录`)
    }
    const skillsDir = path.join(ideDir, 'skills')
    if (!fs.existsSync(skillsDir)) {
      fs.mkdirSync(skillsDir, { recursive: true })
      console.log(`[MyBricks] 创建 ${path.basename(ideDir)}/skills 目录`)
    }

    const pluginSkillsDir = path.join(context.extensionPath, 'src', 'skills')
    if (!fs.existsSync(pluginSkillsDir)) {
      throw new Error('插件中不存在 src/skills 目录')
    }
    const pluginMybricksAssistantDir = path.join(pluginSkillsDir, 'mybricks-assistant')
    if (!fs.existsSync(pluginMybricksAssistantDir)) {
      throw new Error('插件中不存在 mybricks-assistant 目录')
    }

    const userMybricksAssistantDir = path.join(skillsDir, 'mybricks-assistant')
    if (fs.existsSync(userMybricksAssistantDir)) {
      fs.rmSync(userMybricksAssistantDir, { recursive: true, force: true })
      console.log('[MyBricks] 删除已存在的 mybricks-assistant 目录')
    }
    copyDirRecursive(pluginMybricksAssistantDir, userMybricksAssistantDir)
    console.log(`[MyBricks] 成功复制 mybricks-assistant 到 ${path.basename(ideDir)}/skills`)
    return true
  } catch (error) {
    console.error('[MyBricks] 安装 Skill 时出错:', error)
    vscode.window.showErrorMessage('[MyBricks] 安装 Skill 失败: ' + error.message)
    return false
  }
}

module.exports = {
  setupSkill,
  getIDEDir,
}
