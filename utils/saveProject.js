const vscode = require('vscode')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { getWorkspaceFolder } = require('./utils')
const { getPreferredExtension } = require('../src/fileExtension')

/**
 * 生成一个符合 RFC 4122 v4 规范的唯一 ID
 * @returns {string}
 */
function generateFileId() {
  return crypto.randomBytes(12).toString('base64url')
}

/**
 * 确保 content 对象中存在合法的 meta.fileId，若不存在则返回补全后的副本（不修改原对象）
 * @param {Object} content
 * @returns {{ content: Object, added: boolean }} added=true 表示本次新生成了 fileId
 */
function ensureMetaFileId(content) {
  if (content && typeof content === 'object' && typeof content.meta?.fileId === 'string' && content.meta.fileId.trim()) {
    return { content, added: false }
  }
  const existingMeta = (content && typeof content.meta === 'object' && content.meta !== null) ? content.meta : {}
  const newContent = { ...content, meta: { ...existingMeta, fileId: generateFileId() } }
  return { content: newContent, added: true }
}

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
      const raw = fs.readFileSync(filePath, 'utf-8').trim()
      const mtime = fs.statSync(filePath).mtimeMs
      if (!raw) return { content: null, path: filePath, mtime }
      let parsed = JSON.parse(raw)
      // 如果文件中没有 meta.fileId，补全后写回磁盘
      const { content: patched, added } = ensureMetaFileId(parsed)
      if (added) {
        fs.writeFileSync(filePath, JSON.stringify(patched, null, 2), 'utf-8')
        parsed = patched
      }
      return { content: parsed, path: filePath, mtime }
    }

    // 没有指定文件路径，返回 null（新建项目）
    return {
      content: null,
      path: null,
      mtime: null,
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
 * 保存项目：若有当前打开的设计文件（.ui / .mybricks）则直接写回，否则弹窗选择保存位置（默认使用配置的优先后缀）
 * @param {vscode.ExtensionContext} context - 扩展上下文
 * @param {Object} saveContent - 要保存的项目数据
 * @param {string|null} [currentFilePath] - 当前项目文件路径（有则直接保存，不弹窗）
 * @param {boolean} [silent=false] - true 时静默保存，不弹右下角成功提示
 * @returns {Promise<{ success: boolean, path?: string, message?: string }>}
 */
async function saveProject(context, saveContent, currentFilePath, silent = false) {
  try {
    let savePath = currentFilePath && fs.existsSync(currentFilePath) ? currentFilePath : null

    if (!savePath) {
      const preferredExt = getPreferredExtension()
      const workspaceFolder = getWorkspaceFolder(context)

      const input = await vscode.window.showInputBox({
        title: '新建 MyBricks 设计文件',
        prompt: `输入文件名，将保存到工作区根目录（后缀 ${preferredExt}）`,
        value: 'project',
        validateInput: (v) => {
          if (!v.trim()) return '文件名不能为空'
          if (/[\\/:*?"<>|]/.test(v)) return '文件名包含非法字符'
          return null
        },
      })
      if (input == null) return { success: false, message: '用户取消保存' }

      let fileName = input.trim()
      // 没有后缀或后缀不是支持的格式，统一补上首选后缀
      const ext = path.extname(fileName)
      if (!ext) {
        fileName = fileName + preferredExt
      } else if (ext !== '.ui' && ext !== '.mybricks') {
        fileName = path.basename(fileName, ext) + preferredExt
      }

      savePath = path.join(workspaceFolder.fsPath, fileName)
    }

    const dir = path.dirname(savePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    // 确保 meta.fileId 存在，若无则生成
    const { content: contentToSave } = ensureMetaFileId(saveContent)
    fs.writeFileSync(savePath, JSON.stringify(contentToSave, null, 2), 'utf-8')
    if (!silent) vscode.window.showInformationMessage(`文件已保存: ${path.basename(savePath)}`)
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
