const vscode = require('vscode')

/** 支持的设计文件后缀（用于打开/识别） */
const SUPPORTED_EXTENSIONS = ['.tui']

function normalizeExtension(ext) {
  if (typeof ext !== 'string') return ''
  const normalized = ext.trim().toLowerCase()
  if (!normalized) return ''
  if (normalized === 'tui' || normalized === '.tui') {
    return '.tui'
  }
  return normalized.startsWith('.') ? normalized : `.${normalized}`
}

/**
 * 获取配置的优先后缀（新建/另存为时默认使用）
 * @returns {string} 如 '.tui'
 */
function getPreferredExtension() {
  const ext = vscode.workspace.getConfiguration('mybricksTaro').get('preferredFileExtension')
  const normalized = normalizeExtension(ext)
  return SUPPORTED_EXTENSIONS.includes(normalized) ? normalized : '.tui'
}

/**
 * 判断路径是否为 MyBricks 设计文件（.tui）
 * @param {string} filePath
 * @returns {boolean}
 */
function isMybricksFile(filePath) {
  if (!filePath || typeof filePath !== 'string') return false
  const normalized = filePath.replace(/\\/g, '/').toLowerCase()
  return normalized.endsWith('.tui')
}

function getFileBaseName(filePath) {
  if (!filePath || typeof filePath !== 'string') return ''
  const normalized = filePath.replace(/\\/g, '/')
  const fileName = normalized.split('/').pop() ?? normalized
  if (fileName.toLowerCase().endsWith('.tui')) {
    return fileName.slice(0, -'.tui'.length)
  }
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName
}

module.exports = {
  SUPPORTED_EXTENSIONS,
  getPreferredExtension,
  isMybricksFile,
  getFileBaseName,
  normalizeExtension,
}
