const vscode = require('vscode')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { PROTECTED_DIRS } = require('./constants')

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

function isPathInsideRoot(root, fullPath) {
  const relative = path.relative(root, fullPath)
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative))
}

function normalizeRelativePath(relativePath) {
  return String(relativePath || '').replace(/\\/g, '/').replace(/^\/+/, '') || '.'
}

/**
 * 读取工作区内的文件
 * @param {string} relativePath - 相对于工作区根目录的路径
 * @returns {{ content: string } | { error: string }}
 */
function readWorkspaceFile(relativePath) {
  const root = getWorkspaceRoot()
  const fullPath = path.resolve(root, relativePath)
  if (!isPathInsideRoot(root, fullPath)) {
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
 * 写入单个文件到工作区（增量：内容一致则不写入）
 * @param {string} relativePath - 相对于工作区根目录的路径
 * @param {string} content - 文件内容
 * @returns {{ ok: true, updated?: boolean } | { error: string }}
 */
function writeWorkspaceFile(relativePath, content) {
  const root = getWorkspaceRoot()
  const fullPath = path.resolve(root, relativePath)
  if (!isPathInsideRoot(root, fullPath)) {
    return { error: '路径不能超出工作区范围' }
  }
  if (path.relative(root, fullPath).split(path.sep).some((seg) => PROTECTED_DIRS.includes(seg))) {
    return { error: '不允许写入 node_modules、.git 等受保护目录' }
  }

  try {
    const dir = path.dirname(fullPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    if (fs.existsSync(fullPath)) {
      const current = fs.readFileSync(fullPath, 'utf-8')
      if (current === content) return { ok: true, updated: false }
    }
    fs.writeFileSync(fullPath, content, 'utf-8')
    return { ok: true, updated: true }
  } catch (err) {
    return { error: err.message || String(err) }
  }
}

/**
 * 删除工作区内的文件或目录
 * @param {string[]} relativePaths - 相对于工作区根目录的路径列表
 * @returns {{ ok: true, deleted: string[] } | { error: string, deleted?: string[] }}
 */
function deleteWorkspaceFiles(relativePaths) {
  const root = getWorkspaceRoot()
  const deleted = []

  if (!Array.isArray(relativePaths)) {
    return { error: 'paths 参数需为数组' }
  }

  for (const relativePath of relativePaths) {
    const fullPath = path.resolve(root, relativePath)
    if (!isPathInsideRoot(root, fullPath)) {
      return { error: '路径不能超出工作区范围', deleted }
    }
    if (path.relative(root, fullPath).split(path.sep).some((seg) => PROTECTED_DIRS.includes(seg))) {
      return { error: '不允许删除 node_modules、.git 等受保护目录', deleted }
    }
  }

  try {
    for (const relativePath of relativePaths) {
      const fullPath = path.resolve(root, relativePath)
      if (!fs.existsSync(fullPath)) continue
      fs.rmSync(fullPath, { recursive: true, force: true })
      deleted.push(path.relative(root, fullPath))
    }
    return { ok: true, deleted }
  } catch (err) {
    return { error: err.message || String(err), deleted }
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
  if (!isPathInsideRoot(root, baseFull)) {
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
          // 增量更新：仅当文件不存在或内容不一致时才写入
          const exists = fs.existsSync(itemPath)
          if (exists) {
            const current = fs.readFileSync(itemPath, 'utf-8')
            if (current === content) continue
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

function readFilesFromRoot(root, virtualRoot = '') {
  if (!root || !fs.existsSync(root)) return { files: [] }

  const normalizedRoot = path.resolve(root)
  const prefix = virtualRoot ? String(virtualRoot).replace(/\/?$/, '/') : ''
  const skipDirs = new Set([
    'node_modules', '.git', 'dist', 'build', 'out', 'output', '.next',
    '.nuxt', '.cache', '.turbo', '.parcel-cache', 'coverage', '.nyc_output',
    '.svelte-kit', '__pycache__', '.pytest_cache', '.venv', 'venv',
    '.idea', '.vscode', '.DS_Store',
  ])
  const skipExts = new Set(['.tui'])
  const maxFileSize = 1 * 1024 * 1024
  const results = []

  function walk(dir, relBase) {
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const relPath = relBase ? relBase + '/' + entry.name : entry.name
      if (entry.name.startsWith('.')) continue

      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue
        walk(path.join(dir, entry.name), relPath)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (skipExts.has(ext)) continue
        const fullPath = path.join(dir, entry.name)
        if (!isPathInsideRoot(normalizedRoot, fullPath)) continue
        try {
          const stat = fs.statSync(fullPath)
          if (stat.size > maxFileSize) continue
          const content = fs.readFileSync(fullPath, 'utf-8')
          results.push({ path: prefix + relPath, content })
        } catch {
          // 跳过二进制或无法读取的文件。
        }
      }
    }
  }

  walk(normalizedRoot, '')
  return { files: results }
}

function writeFileInRoot(root, relativePath, content) {
  const normalizedRoot = path.resolve(root)
  const safeRelativePath = normalizeRelativePath(relativePath)
  const fullPath = path.resolve(normalizedRoot, safeRelativePath)
  if (!isPathInsideRoot(normalizedRoot, fullPath)) {
    return { error: '路径不能超出项目范围' }
  }
  if (path.relative(normalizedRoot, fullPath).split(path.sep).some((seg) => PROTECTED_DIRS.includes(seg))) {
    return { error: '不允许写入 node_modules、.git 等受保护目录' }
  }

  try {
    const dir = path.dirname(fullPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    if (fs.existsSync(fullPath)) {
      const current = fs.readFileSync(fullPath, 'utf-8')
      if (current === content) return { ok: true, updated: false }
    }
    fs.writeFileSync(fullPath, content, 'utf-8')
    return { ok: true, updated: true }
  } catch (err) {
    return { error: err.message || String(err) }
  }
}

function deleteFilesInRoot(root, relativePaths) {
  const normalizedRoot = path.resolve(root)
  const deleted = []

  if (!Array.isArray(relativePaths)) {
    return { error: 'paths 参数需为数组' }
  }

  for (const relativePath of relativePaths) {
    const safeRelativePath = normalizeRelativePath(relativePath)
    if (safeRelativePath === '.') {
      return { error: '不允许删除项目根目录', deleted }
    }
    const fullPath = path.resolve(normalizedRoot, safeRelativePath)
    if (!isPathInsideRoot(normalizedRoot, fullPath)) {
      return { error: '路径不能超出项目范围', deleted }
    }
    if (path.relative(normalizedRoot, fullPath).split(path.sep).some((seg) => PROTECTED_DIRS.includes(seg))) {
      return { error: '不允许删除 node_modules、.git 等受保护目录', deleted }
    }
  }

  try {
    for (const relativePath of relativePaths) {
      const fullPath = path.resolve(normalizedRoot, normalizeRelativePath(relativePath))
      if (!fs.existsSync(fullPath)) continue
      fs.rmSync(fullPath, { recursive: true, force: true })
      deleted.push(path.relative(normalizedRoot, fullPath))
    }
    return { ok: true, deleted }
  } catch (err) {
    return { error: err.message || String(err), deleted }
  }
}

module.exports = {
  PROTECTED_DIRS,
  getWorkspaceRoot,
  isPathInsideRoot,
  readFilesFromRoot,
  readWorkspaceFile,
  writeWorkspaceFile,
  writeFileInRoot,
  deleteWorkspaceFiles,
  deleteFilesInRoot,
  writeWorkspaceFilesFromResults,
}
