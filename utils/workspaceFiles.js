const vscode = require('vscode')
const fs = require('fs')
const path = require('path')
const os = require('os')

/**
 * 获取工作区根路径（未打开工作区时使用 process.cwd() 或用户目录作为回退）
 * @returns {string} 工作区根目录的 fsPath
 */
function getWorkspaceRoot() {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (workspaceFolders && workspaceFolders.length > 0) {
    return workspaceFolders[0].uri.fsPath
  }
  return process.cwd() || path.join(os.homedir(), 'MyBricks')
}

/**
 * 读取工作区内的文件
 * @param {string} relativePath - 相对于工作区根目录的路径
 * @returns {{ content: string } | { error: string }}
 */
function readWorkspaceFile(relativePath) {
  const root = getWorkspaceRoot()
  const fullPath = path.resolve(root, relativePath)
  if (!fullPath.startsWith(root)) {
    return { error: '路径不能超出工作区范围' }
  }

  try {
    if (!fs.existsSync(fullPath)) {
      return { error: `文件不存在: ${relativePath}` }
    }
    if (!fs.statSync(fullPath).isFile()) {
      return { error: `不是文件: ${relativePath}` }
    }
    const content = fs.readFileSync(fullPath, 'utf-8')
    return { content }
  } catch (err) {
    return { error: err.message || String(err) }
  }
}

/**
 * 写入单个文件到工作区
 * @param {string} relativePath - 相对于工作区根目录的路径
 * @param {string} content - 文件内容
 * @returns {{ ok: true } | { error: string }}
 */
function writeWorkspaceFile(relativePath, content) {
  const root = getWorkspaceRoot()
  const fullPath = path.resolve(root, relativePath)
  if (!fullPath.startsWith(root)) {
    return { error: '路径不能超出工作区范围' }
  }
  if (path.relative(root, fullPath).split(path.sep).some((seg) => seg === 'node_modules' || seg === '.git')) {
    return { error: '不允许写入 node_modules、.git 等受保护目录' }
  }

  try {
    const dir = path.dirname(fullPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(fullPath, content, 'utf-8')
    return { ok: true }
  } catch (err) {
    return { error: err.message || String(err) }
  }
}

/**
 * 出码 results 结构：数组项为 { name, type: 'file'|'folder', content?, children? }
 * 递归创建目录和文件
 * @param {string} basePath - 基础路径（相对工作区根），如 '' 或 'src'
 * @param {Array<{ name: string, type: string, content?: string, children?: Array }>} results - 出码返回的树结构
 * @returns {{ ok: true, written: string[] } | { error: string, written?: string[] }}
 */
function writeWorkspaceFilesFromResults(basePath, results) {
  const root = getWorkspaceRoot()
  const baseFull = basePath ? path.resolve(root, basePath) : root
  if (!baseFull.startsWith(root)) {
    return { error: '基础路径不能超出工作区范围' }
  }

  const written = []
  // 重复导出时不写入、不清理的目录（避免覆盖用户安装的 node_modules 等）
  const SKIP_DIRS = new Set(['node_modules', '.git'])

  function shouldSkipPath(fileOrDirPath) {
    const relativePath = path.relative(root, fileOrDirPath)
    const segments = relativePath.split(path.sep)
    return segments.some((seg) => SKIP_DIRS.has(seg))
  }

  function processItem(dirPath, items) {
    if (!Array.isArray(items)) return
    for (const item of items) {
      const name = item && item.name
      const type = item && item.type
      if (!name) continue

      const safeName = path.basename(name) // 避免 path 注入
      const itemPath = path.join(dirPath, safeName)
      if (shouldSkipPath(itemPath)) continue

      if (type === 'file') {
        const content = item.content != null ? String(item.content) : ''
        try {
          const dir = path.dirname(itemPath)
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
          }
          fs.writeFileSync(itemPath, content, 'utf-8')
          written.push(path.relative(root, itemPath))
        } catch (err) {
          throw new Error(`写入文件失败 ${path.relative(root, itemPath)}: ${err.message}`)
        }
      } else if (type === 'folder') {
        if (!fs.existsSync(itemPath)) {
          fs.mkdirSync(itemPath, { recursive: true })
        }
        if (Array.isArray(item.children) && item.children.length > 0) {
          processItem(itemPath, item.children)
        }
      }
    }
  }

  try {
    if (basePath && !fs.existsSync(baseFull)) {
      fs.mkdirSync(baseFull, { recursive: true })
    }
    processItem(baseFull, results)
    return { ok: true, written }
  } catch (err) {
    return { error: err.message || String(err), written }
  }
}

module.exports = {
  getWorkspaceRoot,
  readWorkspaceFile,
  writeWorkspaceFile,
  writeWorkspaceFilesFromResults,
}
