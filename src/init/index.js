const vscode = require('vscode')
const path = require('path')
const fs = require('fs')
const { getWorkspaceFolder } = require('../../utils/utils')

/**
 * 获取目标 IDE 配置目录（优先级：.claude > .cursor）
 * @param {string} projectRoot - 项目根目录
 * @returns {string} 目标目录路径
 */
function getTargetIDEDir(projectRoot) {
  // 优先检查 .claude
  const claudeDir = path.join(projectRoot, '.claude')
  if (fs.existsSync(claudeDir)) {
    console.log('[MyBricks] 检测到 .claude 目录，将使用 .claude')
    return claudeDir
  }

  // 检查 .cursor
  const cursorDir = path.join(projectRoot, '.cursor')
  if (fs.existsSync(cursorDir)) {
    console.log('[MyBricks] 检测到 .cursor 目录，将使用 .cursor')
    return cursorDir
  }

  // 都不存在，默认创建 .claude
  console.log('[MyBricks] 未检测到现有 IDE 配置目录，将默认使用 .claude')
  return claudeDir
}

/**
 * 递归复制目录
 * @param {string} src - 源目录
 * @param {string} dest - 目标目录
 */
function copyDirRecursive(src, dest) {
  // 创建目标目录
  fs.mkdirSync(dest, { recursive: true })

  // 读取源目录中的所有文件和子目录
  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      // 递归复制子目录
      copyDirRecursive(srcPath, destPath)
    } else {
      // 复制文件
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

/**
 * 预处理环境参数（获取 projectRoot 和 ideDir）
 * @param {vscode.ExtensionContext} context - 扩展上下文
 * @returns {{ projectRoot: string, ideDir: string }} 项目根目录和 IDE 配置目录
 * @throws {Error} 当工作区不存在时抛出错误
 */
function prepareInitParams(context) {
  const workspaceFolder = getWorkspaceFolder(context)
  if (!workspaceFolder) {
    throw new Error('未检测到工作区')
  }
  
  const projectRoot = workspaceFolder.fsPath
  const ideDir = getTargetIDEDir(projectRoot)
  
  return { projectRoot, ideDir }
}

/**
 * 安装 MyBricks Skill
 * @param {vscode.ExtensionContext} context - 扩展上下文
 */
async function setupSkill(context) {
  try {
    const { ideDir } = prepareInitParams(context)

    // 获取插件的 skills 目录
    const pluginSkillsDir = path.join(context.extensionPath, 'skills')

    // 检查插件的 skills 目录是否存在
    if (!fs.existsSync(pluginSkillsDir)) {
      throw new Error('插件中不存在 skills 目录')
    }

    // 1. 获取 skills 目录路径
    const skillsDir = path.join(ideDir, 'skills')

    // 2. 删除用户项目中已存在的 mybricks-assistant（如果有）
    const userMybricksAssistantDir = path.join(skillsDir, 'mybricks-assistant')
    if (fs.existsSync(userMybricksAssistantDir)) {
      fs.rmSync(userMybricksAssistantDir, { recursive: true, force: true })
      console.log('[MyBricks] 删除已存在的 mybricks-assistant 目录')
    }

    // 3. 复制插件的 mybricks-assistant 到用户的目录
    const pluginMybricksAssistantDir = path.join(pluginSkillsDir, 'mybricks-assistant')
    if (!fs.existsSync(pluginMybricksAssistantDir)) {
      throw new Error('插件中不存在 mybricks-assistant 目录')
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

/**
 * 配置 MCP 服务器连接到 mcp.json
 * @param {vscode.ExtensionContext} context - 扩展上下文
 * @param {string} serverUrl - MCP 服务器 URL（支持动态 IP）
 */
async function setupMCPConfig(context, serverUrl) {
  try {
    const { ideDir } = prepareInitParams(context)
    const mcpConfigPath = path.join(ideDir, 'mcp.json')

    // 读取现有的 mcp.json（如果存在）或创建新的
    let mcpConfig = {}
    if (fs.existsSync(mcpConfigPath)) {
      const content = fs.readFileSync(mcpConfigPath, 'utf8')
      try {
        mcpConfig = JSON.parse(content)
      } catch (error) {
        console.warn('[MyBricks] mcp.json 格式不正确，将重新创建:', error.message)
        mcpConfig = {}
      }
    }

    // 确保 mcpServers 对象存在
    if (!mcpConfig.mcpServers) {
      mcpConfig.mcpServers = {}
    }

    // 更新或添加 mybricks 服务器配置
    mcpConfig.mcpServers['mybricks-mcp'] = {
      url: serverUrl,
    }

    // 写入 mcp.json
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2), 'utf8')
    console.log(`[MyBricks] 成功配置 MCP 服务器 URL: ${serverUrl}`)
    return true
  } catch (error) {
    console.error('[MyBricks] 配置 MCP 时出错:', error)
    vscode.window.showErrorMessage(
      '[MyBricks] 配置 MCP 失败: ' + error.message
    )
    return false
  }
}

/**
 * 初始化 MyBricks 环境（安装 Skill 并配置 MCP）
 * @param {vscode.ExtensionContext} context - 扩展上下文
 * @param {string} serverUrl - MCP 服务器 URL（用于动态 IP 支持）
 */
async function initMybricksEnvironment(context, serverUrl) {
  try {
    const { ideDir } = prepareInitParams(context)

    // 1. 创建或确认 IDE 目录存在
    if (!fs.existsSync(ideDir)) {
      fs.mkdirSync(ideDir, { recursive: true })
      console.log(`[MyBricks] 创建 ${path.basename(ideDir)} 目录`)
    }

    // 2. 创建或确认 skills 目录存在
    const skillsDir = path.join(ideDir, 'skills')
    if (!fs.existsSync(skillsDir)) {
      fs.mkdirSync(skillsDir, { recursive: true })
      console.log(`[MyBricks] 创建 ${path.basename(ideDir)}/skills 目录`)
    }

    // 3. 安装 Skill
    const skillSuccess = await setupSkill(context)
    if (!skillSuccess) {
      return false
    }

    // 4. 配置 MCP
    const mcpSuccess = await setupMCPConfig(context, serverUrl)
    if (!mcpSuccess) {
      console.warn('[MyBricks] MCP 配置失败，但 skill 已安装成功')
    }

    vscode.window.showInformationMessage('[MyBricks] 成功初始化 MyBricks 环境')
    return true
  } catch (error) {
    console.error('[MyBricks] 初始化环境时出错:', error)
    vscode.window.showErrorMessage('[MyBricks] 初始化环境失败: ' + error.message)
    return false
  }
}

module.exports = {
  initMybricksEnvironment,
}
