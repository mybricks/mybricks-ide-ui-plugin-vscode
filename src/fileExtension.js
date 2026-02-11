const vscode = require('vscode')

/** 支持的设计文件后缀（用于打开/识别） */
const SUPPORTED_EXTENSIONS = ['.ui', '.mybricks']

/**
 * 获取配置的优先后缀（新建/另存为时默认使用）
 * @returns {string} 如 '.ui' 或 '.mybricks'
 */
function getPreferredExtension() {
  const ext = vscode.workspace.getConfiguration('mybricks').get('preferredFileExtension')
  if (typeof ext === 'string' && ext.startsWith('.')) return ext
  if (ext === 'ui' || ext === 'mybricks') return '.' + ext
  return '.ui'
}

/**
 * 判断路径是否为 MyBricks 设计文件（.ui 或 .mybricks）
 * @param {string} filePath
 * @returns {boolean}
 */
function isMybricksFile(filePath) {
  if (!filePath || typeof filePath !== 'string') return false
  const normalized = filePath.replace(/\\/g, '/').toLowerCase()
  return SUPPORTED_EXTENSIONS.some((ext) => normalized.endsWith(ext.toLowerCase()))
}

module.exports = {
  SUPPORTED_EXTENSIONS,
  getPreferredExtension,
  isMybricksFile,
}
