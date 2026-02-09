const vscode = require('vscode')
const fs = require('fs')
const path = require('path')
const { getWorkspaceFolder } = require('./utils')

/**
 * 获取 MyBricks 项目文件内容及路径（用于保存时判断是否直接写回当前文件）
 * @param {vscode.ExtensionContext} context - 扩展上下文
 * @param {string|null} [filePath] - 指定的文件路径（如果有）
 * @returns {{ content: Object|null, path: string|null }} 项目内容与来源文件路径（无则 path 为 null）
 */
function getFileContent(context, filePath = null) {
  try {
    // 如果指定了文件路径，直接读取该文件
    if (filePath && fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      return { content: JSON.parse(content), path: filePath }
    }

    // 没有指定文件路径，返回 null（新建项目）
    return {
      content: null,
      path: null,
    }
  } catch (error) {
    vscode.window.showErrorMessage(`读取项目失败: ${error.message}`)
    console.error('Error reading project:', error)
    return { content: null, path: null }
  }
}

/**
 * 保存 MyBricks 项目文件内容（已废弃，请使用 saveProject）
 * @deprecated 使用 saveProject 代替
 * @param {vscode.ExtensionContext} context - 扩展上下文
 * @param {Object} data - 项目数据
 */
function saveFileContent(context, data) {
  console.warn('[MyBricks] saveFileContent 已废弃，请使用 saveProject')
  // 为了向后兼容，调用 saveProject
  return saveProject(context, data, null)
}

/**
 * 保存项目：若有当前打开的 .mybricks 文件则直接写回，否则弹窗选择保存位置
 * @param {vscode.ExtensionContext} context - 扩展上下文
 * @param {Object} saveContent - 要保存的项目数据
 * @param {string|null} [currentFilePath] - 当前项目文件路径（有则直接保存，不弹窗）
 * @returns {Promise<{ success: boolean, path?: string, message?: string }>}
 */
async function saveProject(context, saveContent, currentFilePath) {
  try {
    let savePath = currentFilePath && fs.existsSync(currentFilePath) ? currentFilePath : null

    if (!savePath) {
      const workspaceFolder = getWorkspaceFolder(context)
      const defaultUri = vscode.Uri.file(path.join(workspaceFolder.fsPath, 'project.mybricks'))
      const uri = await vscode.window.showSaveDialog({
        defaultUri,
        filters: { 'MyBricks 项目': ['mybricks'], 'All Files': ['*'] },
        title: '保存 MyBricks 项目',
      })
      if (!uri) return { success: false, message: '用户取消保存' }
      savePath = uri.fsPath
      if (!path.extname(savePath)) savePath = savePath + '.mybricks'
    }

    const dir = path.dirname(savePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(savePath, JSON.stringify(saveContent, null, 2), 'utf-8')
    vscode.window.showInformationMessage(`项目已保存: ${path.basename(savePath)}`)
    return { success: true, path: savePath }
  } catch (error) {
    vscode.window.showErrorMessage(`保存项目失败: ${error.message}`)
    console.error('Error saving project:', error)
    return { success: false, message: error.message }
  }
}

module.exports = {
  getFileContent,
  saveFileContent,
  saveProject,
}
