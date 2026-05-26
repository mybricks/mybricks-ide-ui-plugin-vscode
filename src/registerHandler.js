const vscode = require('vscode')
const path = require('path')
const fs = require('fs')
const axios = require('axios')

const { isMybricksFile, getPreferredExtension, getFileBaseName } = require('./fileExtension')
const {
  getFileContent,
  saveFileContent,
  saveProject,
} = require('../utils/saveProject')
const { getWorkspaceFolder } = require('../utils/utils')
const { exportProject } = require('../utils/exportProject')
const { stopProxyServer, startProxyServer, getPort } = require('./proxy-server')
const {
  readWorkspaceFile,
  writeWorkspaceFile,
  writeFileInRoot,
  deleteWorkspaceFiles,
  deleteFilesInRoot,
  writeWorkspaceFilesFromResults,
  getWorkspaceRoot,
  isPathInsideRoot,
  readFilesFromRoot,
} = require('../utils/workspaceFiles')
const { wrapResultsAsProject } = require('../utils/projectModeOutput')
const { STATE_KEYS } = require('../utils/constants')
const { runCommandInRoot, runWorkspaceCommand } = require('../utils/workspaceCommand')
const { getInstance: getWebviewManager } = require('./manager/webviewManager')

/**
 * 注册所有事件处理器
 * @param {MessageAPI} messageApiInstance - 消息 API 实例
 * @param {vscode.ExtensionContext} context - 扩展上下文
 */
function registerHandlers(messageApiInstance, context, filePath) {
  // 在系统文件管理器中定位文件（macOS: Finder，Windows: 资源管理器）
  messageApiInstance.registerHandler('revealInOS', async (data) => {
    const targetPath = data?.filePath
    if (!targetPath) return
    if (fs.existsSync(targetPath)) {
      await vscode.commands.executeCommand(
        'revealFileInOS',
        vscode.Uri.file(targetPath),
      )
    }
  })

  // 读取「是否开启 MCP」配置（供前端与扩展内统一读取和监听）
  messageApiInstance.registerHandler('getMCPEnabled', () => {
    return (
      vscode.workspace.getConfiguration('mybricksTaro').get('mcp.enabled') === true
    )
  })

  // 读取 AI 渠道覆盖偏好（null 表示未设置，跟随 infra 检测结果）
  messageApiInstance.registerHandler('getAIChannelOverride', () => {
    return context.globalState.get(STATE_KEYS.AI_CHANNEL_OVERRIDE, null)
  })

  // 设置 AI 渠道覆盖偏好（'mybricks' 或 null 重置）
  messageApiInstance.registerHandler('setAIChannelOverride', async (data) => {
    const channel = data?.channel ?? null
    await context.globalState.update(STATE_KEYS.AI_CHANNEL_OVERRIDE, channel)
    return { success: true }
  })

  // 重新加载当前 WebView 页面（重新赋值 html 触发完整刷新）
  // 注意：需先返回响应，再执行 reload，否则 webview 重建后 response 无法送达前端
  messageApiInstance.registerHandler('reloadWebview', () => {
    setImmediate(() => {
      const webviewManager = getWebviewManager()
      // 使用闭包中的 filePath，而非全局状态
      webviewManager.reloadPanel(filePath)
    })
    return { success: true }
  })

  // 读取 AI 请求凭证（Token）
  messageApiInstance.registerHandler('getAIToken', () => {
    const token = vscode.workspace.getConfiguration('mybricksTaro').get('ai.token')
    return typeof token === 'string' ? token : ''
  })

  // 打开设置页并定位到 MyBricks AI Token 配置项
  messageApiInstance.registerHandler('openAISettings', async () => {
    await vscode.commands.executeCommand(
      'workbench.action.openSettings',
      'mybricksTaro.ai.token',
    )
  })

  // 获取优先后缀（新建/另存为默认，如 .ui）
  messageApiInstance.registerHandler('getPreferredFileExtension', () =>
    getPreferredExtension(),
  )

  // 获取低码项目内容（返回 { content, path }，path 为当前项目文件路径，无则 null）
  messageApiInstance.registerHandler('getFileContent', async () => {
    // 直接使用闭包中的 filePath，不再依赖全局状态
    return getFileContent(context, filePath)
  })

  // 保存低码项目
  messageApiInstance.registerHandler('saveFileContent', async (data) => {
    saveFileContent(context, data)
  })

  // VSCode 原生通知（前端通过 call('showNotification', { type, message }) 触发）
  // type: 'info' | 'warning' | 'error'
  // revealPath: 可选，通知中附带「在文件系统中打开」按钮，点击后 reveal 该路径
  messageApiInstance.registerHandler('showNotification', async (data) => {
    const type = data?.type || 'info'
    const msg = data?.message || ''
    const revealPath = data?.revealPath || ''
    if (!msg) return
    const showFn =
      type === 'error' ? vscode.window.showErrorMessage
      : type === 'warning' ? vscode.window.showWarningMessage
      : vscode.window.showInformationMessage
    if (revealPath) {
      const action = await showFn(msg, '在文件系统中打开')
      if (action === '在文件系统中打开') {
        vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(revealPath))
      }
    } else {
      showFn(msg)
    }
    return { success: true }
  })

  // 将 projectName + exportDir 安全地拼接为 basePath（相对工作区根）并返回绝对路径
  // 前端传入这两个值，后端用 path.join 处理跨平台路径，避免前端字符串拼接不安全
  messageApiInstance.registerHandler('resolveExportPath', (data) => {
    const projectName = (data?.projectName || 'mybricks-app').trim()
    const exportDir = data?.exportDir || '.'
    const root = getWorkspaceRoot()
    const basePath = exportDir === '.' ? projectName : path.join(exportDir, projectName)
    const fullPath = path.resolve(root, basePath)
    if (!fullPath.startsWith(root)) {
      return { error: '导出路径超出工作区范围' }
    }
    return { basePath, fullPath }
  })

  // 未命名文件有编辑时通知用户保存（右下角 VSCode 原生提醒）
  // 防重：60s 内只弹一次
  let _unnamedDirtyNotifiedAt = 0
  messageApiInstance.registerHandler('notifyUnnamedFileDirty', () => {
    const now = Date.now()
    if (now - _unnamedDirtyNotifiedAt < 60_000) return
    _unnamedDirtyNotifiedAt = now
    vscode.window.showWarningMessage(
      '当前设计文件尚未保存到磁盘，建议先保存点击上方「保存」按钮进行保存。',
    )
  })

  // AI 插件下载文件：弹窗选择保存路径，将 content 按字符串写入
  messageApiInstance.registerHandler('downloadFile', async (data) => {
    const name =
      data && data.name != null ? String(data.name).trim() : 'download'
    const content =
      data && data.content !== undefined ? String(data.content) : ''
    const workspaceUri = getWorkspaceFolder(context)
    const defaultUri = path.join(workspaceUri.fsPath, name)
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(defaultUri),
      filters: { 'All Files': ['*'] },
      title: '保存文件',
    })
    if (!uri) return { success: false, message: '用户取消保存' }
    const savePath = uri.fsPath
    const dir = path.dirname(savePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(savePath, content, 'utf-8')

    vscode.window.showInformationMessage(`已保存: ${path.basename(savePath)}`, '在文件系统中打开').then((action) => {
      if (action === '在文件系统中打开') {
        vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(savePath))
      }
    })
    return { success: true, path: savePath }
  })

  // 保存项目：有 currentFilePath 则直接保存，否则弹窗选择路径和文件名（另存为）
  messageApiInstance.registerHandler('saveProject', async (data) => {
    const webviewManager = getWebviewManager()
    const saveContent = data?.saveContent != null ? data.saveContent : data
    // 优先使用前端传入的路径，否则使用闭包中的 filePath（不再依赖全局状态）
    let currentFilePath = data?.currentFilePath ?? filePath
    const silent = data?.silent === true
    const res = await saveProject(context, saveContent, currentFilePath, silent)
    // 新建文件另存为成功后：更新当前文件路径、面板标题，并加入最近打开列表
    if (
      res.success &&
      res.path &&
      (!currentFilePath || !fs.existsSync(currentFilePath))
    ) {
      webviewManager.setCurrentFilePath(res.path)
      await webviewManager.addRecentFile(res.path)
      if (messageApiInstance.panel) {
        messageApiInstance.panel.title = path.basename(res.path)
      }
      currentFilePath = res.path // 更新为实际保存的路径
    }
    // 注意：不再触发 workbench.action.files.save，因为它会保存所有脏文件导致死循环
    return res
  })

  // 导出项目
  messageApiInstance.registerHandler('exportProject', async (data) => {
    const { configJson } = data
    const res = await exportProject(context, configJson)
    return res
  })

  // 根据当前设计文件得到导出默认值：项目名 = 文件名（去后缀），导出目录 = 文件所在目录（相对工作区）
  messageApiInstance.registerHandler('getCurrentExportDefaults', () => {
    const root = getWorkspaceRoot()
    // 直接使用闭包中的 filePath，不再依赖全局状态
    if (!filePath) {
      console.log('[导出] getCurrentExportDefaults: 无当前设计文件，返回默认', {
        projectName: 'my_project',
        exportDir: '.',
      })
      return { projectName: 'my_project', exportDir: '.' }
    }
    const dir = path.dirname(filePath)
    let exportDir = path.relative(root, dir)
    if (!exportDir || exportDir.startsWith('..')) exportDir = '.'
    const projectName =
      getFileBaseName(filePath) ||
      'my_project'
    const res = { projectName, exportDir }
    console.log('[导出] getCurrentExportDefaults', {
      filePath,
      root,
      res,
    })
    return res
  })

  // AI 设置变更（渠道切换或关键配置更新）前弹出 VSCode 原生确认弹窗，返回用户的选择
  messageApiInstance.registerHandler('confirmChannelSwitch', async () => {
    const choice = await vscode.window.showWarningMessage(
      'AI 设置已变更，需要刷新设计器后生效，当前未保存的内容将会丢失。',
      { modal: true },
      '保存并刷新'
    )
    if (choice === '保存并刷新') return { action: 'save_and_reload' }
    return { action: 'cancel' }
  })

  // AI 设置（channel、token、custom 配置）存储到 globalState
  messageApiInstance.registerHandler('getAISetting', async () => {
    const existing = context.globalState.get('mybricks.aiSetting', null)
    // 兼容旧版：首次迁移时把 VSCode settings 里的 mybricksTaro.ai.token 写入新格式
    if (!existing?.mybricksAiToken) {
      const oldToken = vscode.workspace.getConfiguration('mybricksTaro').get('ai.token')
      if (typeof oldToken === 'string' && oldToken.trim()) {
        const migrated = { ...(existing ?? {}), mybricksAiToken: oldToken }
        await context.globalState.update('mybricks.aiSetting', migrated)
        return migrated
      }
    }
    return existing
  })

  messageApiInstance.registerHandler('setAISetting', async (data) => {
    await context.globalState.update('mybricks.aiSetting', data ?? null)
    return { success: true }
  })

  // 检查路径是否存在（相对工作区根的路径）
  messageApiInstance.registerHandler('checkPathExists', (data) => {
    const root = getWorkspaceRoot()
    const p = data?.path != null ? String(data.path) : ''
    if (!p) return { exists: false }
    const full = path.resolve(root, p)
    return { exists: fs.existsSync(full) }
  })

  // 选择导出目录（打开文件夹选择器，返回相对工作区根的路径及完整路径）
  messageApiInstance.registerHandler('selectExportDir', async () => {
    const root = getWorkspaceRoot()
    console.log('[导出] selectExportDir: 工作区根', root)
    const uri = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectMany: false,
      defaultUri: vscode.Uri.file(root),
      title: '选择导出目录',
    })
    if (uri && uri[0]) {
      const selected = uri[0].fsPath
      const relative = path.relative(root, selected)
      const result =
        relative && relative !== '..' && !relative.startsWith('..')
          ? { path: relative, fullPath: selected }
          : !relative || relative === '.'
            ? { path: '.', fullPath: root }
            : {}
      console.log('[导出] selectExportDir: 用户选择结果', {
        selected,
        relative,
        result,
      })
      return result.path != null ? result : {}
    }
    console.log('[导出] selectExportDir: 用户取消或无效选择')
    return {}
  })

  // 选择附加项目目录（允许工作区外路径，由用户显式选择授权）
  messageApiInstance.registerHandler('selectIdeProjectDir', async () => {
    const root = getWorkspaceRoot()
    const uri = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      defaultUri: vscode.Uri.file(root),
      title: '选择项目目录',
    })
    if (!uri || !uri[0]) return {}
    const selected = uri[0].fsPath
    return {
      path: selected,
      name: path.basename(selected),
    }
  })

  messageApiInstance.registerHandler('getIdeWorkspaceRoot', () => {
    const root = getWorkspaceRoot()
    return {
      path: root,
      name: path.basename(root),
    }
  })

  // 将导出相对路径解析为工作区内的完整路径（供前端展示）
  messageApiInstance.registerHandler('getExportFullPath', (data) => {
    const basePath =
      data && data.basePath != null ? String(data.basePath).trim() : ''
    if (!basePath) {
      console.log('[导出] getExportFullPath: basePath 为空')
      return { fullPath: '' }
    }
    const root = getWorkspaceRoot()
    const full = path.resolve(root, basePath)
    const fullPath = full.startsWith(root) ? full : root
    console.log('[导出] getExportFullPath', { basePath, root, fullPath })
    return { fullPath }
  })

  const validFilePath = typeof filePath === 'string' && filePath.trim() ? filePath : null

  // 启动接口代理调试服务
  messageApiInstance.registerHandler('debug', async (data) => {
    const proxy = data?.proxy && typeof data.proxy === 'object' ? data.proxy : {}
    const port = await startProxyServer(proxy, validFilePath)
    if (validFilePath) {
      getWebviewManager().addDebuggingPanel(validFilePath)
    }
    return { port }
  })

  // 停止接口代理调试服务
  messageApiInstance.registerHandler('stopDebug', async () => {
    const webviewManager = getWebviewManager()
    if (validFilePath) {
      webviewManager.removeDebuggingPanel(validFilePath)
    }
    await stopProxyServer(validFilePath)
    return { success: true }
  })

  // 通过 extension host 转发 HTTP 请求（绕过 webview 的 CSP/CORS 限制）
  // 支持两种模式：
  //   1. 相对路径（如 /api/xxx）→ 走代理服务器：http://127.0.0.1:{port}/api/xxx
  //   2. 绝对 URL（如 https://example.com/api/xxx）→ 通过代理服务器的 /__absolute_proxy__ 端点转发
  messageApiInstance.registerHandler('httpRequest', async (data) => {
    const { url, method = 'GET', headers = {}, body, params } = data ?? {}

    if (!url) return { error: '缺少 url 参数' }

    let finalUrl = url

    if (/^https?:\/\//.test(url)) {
      // 绝对 URL：通过代理服务器的 /__absolute_proxy__ 端点转发，避免 CORS 限制
      const port = getPort(validFilePath)
      if (port) {
        const encodedUrl = encodeURIComponent(url)
        finalUrl = `http://127.0.0.1:${port}/__absolute_proxy__?url=${encodedUrl}`
      }
      // 若代理服务未启动，则直接用原始 URL 发请求（降级）
    } else if (url.startsWith('/')) {
      // 相对路径：转发到代理服务器
      const port = getPort(validFilePath)
      if (port) {
        finalUrl = `http://127.0.0.1:${port}${url}`
      }
    }

    const res = await axios({
      url: finalUrl,
      method: method.toUpperCase(),
      headers: { 'Accept-Encoding': 'identity', ...headers },
      data: body,
      params,
    })

    return {
      data: res.data,
      headers: res.headers,
      status: res.status,
      statusText: res.statusText,
    }
  })

  // 获取工作区文件列表（用于 AI additionalDirectory / 已打开工作区目录）
  // 递归读取工作区根目录下所有文件，过滤规则：
  //   1. 跳过常见构建/依赖目录（node_modules、.git、dist 等）
  //   2. 跳过 .tui 设计文件
  //   3. 遵循工作区根的 .gitignore / .ignore 规则
  //   4. 默认隐藏 . 开头的文件/目录
  messageApiInstance.registerHandler('getWorkspaceFiles', async () => {
    const root = getWorkspaceRoot()
    if (!root || !fs.existsSync(root)) return { files: [] }

    // 常见需要跳过的目录名
    const SKIP_DIRS = new Set([
      'node_modules', '.git', 'dist', 'build', 'out', 'output', '.next',
      '.nuxt', '.cache', '.turbo', '.parcel-cache', 'coverage', '.nyc_output',
      '.svelte-kit', '__pycache__', '.pytest_cache', '.venv', 'venv',
      '.idea', '.vscode', '.DS_Store',
    ])
    // 跳过的文件扩展名
    const SKIP_EXTS = new Set(['.tui'])
    // 文件大小上限（1MB），避免把大文件也读入内存
    const MAX_FILE_SIZE = 1 * 1024 * 1024

    /**
     * 解析 .gitignore / .ignore 文件，返回模式列表（仅支持基础 glob 前缀匹配）
     * @param {string} filePath
     * @returns {string[]}
     */
    function readIgnorePatterns(filePath) {
      if (!fs.existsSync(filePath)) return []
      try {
        return fs.readFileSync(filePath, 'utf-8')
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'))
      } catch {
        return []
      }
    }

    /**
     * 简易 gitignore 匹配：判断相对路径是否被 pattern 覆盖
     * 支持：精确名称、前缀目录匹配、trailing-slash（目录）、简单 * 通配
     * @param {string} relPath - 相对工作区根的路径（使用 /  分隔符）
     * @param {string} pattern
     * @returns {boolean}
     */
    function matchesPattern(relPath, pattern) {
      // 去掉尾部 /（目录标记）
      const p = pattern.replace(/\/$/, '')
      if (!p) return false
      // 精确匹配或前缀目录匹配
      if (relPath === p || relPath.startsWith(p + '/')) return true
      // 简单通配符：仅含 * 的模式（如 *.log）
      if (p.includes('*')) {
        const escaped = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
        try {
          const re = new RegExp(`^${escaped}$`)
          // 匹配末尾文件名
          const basename = relPath.split('/').pop() || ''
          if (re.test(basename)) return true
          if (re.test(relPath)) return true
        } catch {
          // ignore regex error
        }
      }
      return false
    }

    const ignorePatterns = [
      ...readIgnorePatterns(path.join(root, '.gitignore')),
      ...readIgnorePatterns(path.join(root, '.ignore')),
    ]

    /**
     * 判断相对路径是否应被忽略
     * @param {string} relPath - 相对工作区根，使用 / 分隔符
     * @returns {boolean}
     */
    function shouldIgnore(relPath) {
      if (!relPath) return false
      for (const pattern of ignorePatterns) {
        if (matchesPattern(relPath, pattern)) return true
      }
      return false
    }

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
        if (shouldIgnore(relPath)) continue

        if (entry.isDirectory()) {
          if (SKIP_DIRS.has(entry.name)) continue
          walk(path.join(dir, entry.name), relPath)
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase()
          if (SKIP_EXTS.has(ext)) continue
          const fullPath = path.join(dir, entry.name)
          try {
            const stat = fs.statSync(fullPath)
            if (stat.size > MAX_FILE_SIZE) continue
            const content = fs.readFileSync(fullPath, 'utf-8')
            results.push({ path: 'workspace/' + relPath, content })
          } catch {
            // 跳过无法读取的文件（如二进制文件）
          }
        }
      }
    }

    walk(root, '')
    return { files: results }
  })

  // 读取用户显式添加的附加项目文件，路径边界限制在 root 内
  messageApiInstance.registerHandler('getIdeProjectFiles', async (data) => {
    const root = data?.root != null ? path.resolve(String(data.root)) : ''
    const virtualRoot = data?.virtualRoot != null ? String(data.virtualRoot) : ''
    if (!root || !fs.existsSync(root)) return { files: [] }
    return readFilesFromRoot(root, virtualRoot)
  })

  // 获取当前聚焦的元素信息
  messageApiInstance.registerHandler('getFocusElementInfo', async () => {
    // 调用前端 window.__mybricksAIService.focus 获取当前聚焦的元素信息
    const focusInfo = await messageApiInstance.callWebview('getFocusInfo')
    return focusInfo
  })

  // 读取工作区文件（相对工作区根的路径）
  messageApiInstance.registerHandler('readWorkspaceFile', async (data) => {
    const relativePath = (data && data.path) != null ? String(data.path) : ''
    if (!relativePath) return { error: '缺少 path 参数' }
    return readWorkspaceFile(relativePath)
  })

  // 写入单个文件到工作区
  messageApiInstance.registerHandler('writeWorkspaceFile', async (data) => {
    const relativePath = (data && data.path) != null ? String(data.path) : ''
    const content = (data && data.content) != null ? String(data.content) : ''
    if (!relativePath) return { error: '缺少 path 参数' }
    return writeWorkspaceFile(relativePath, content)
  })

  // 写入附加项目文件（相对附加项目根目录）
  messageApiInstance.registerHandler('writeIdeProjectFile', async (data) => {
    const root = data?.root != null ? path.resolve(String(data.root)) : ''
    const relativePath = data?.path != null ? String(data.path) : ''
    const content = data?.content != null ? String(data.content) : ''
    if (!root || !fs.existsSync(root)) return { error: '项目根目录不存在' }
    if (!relativePath) return { error: '缺少 path 参数' }
    return writeFileInRoot(root, relativePath, content)
  })

  // 删除工作区文件/目录（相对工作区根的路径列表）
  messageApiInstance.registerHandler('deleteWorkspaceFiles', async (data) => {
    const paths = data && Array.isArray(data.paths) ? data.paths.map(String) : []
    if (!paths.length) return { error: '缺少 paths 参数（需为数组）' }
    return deleteWorkspaceFiles(paths)
  })

  // 删除附加项目文件/目录（相对附加项目根目录）
  messageApiInstance.registerHandler('deleteIdeProjectFiles', async (data) => {
    const root = data?.root != null ? path.resolve(String(data.root)) : ''
    const paths = data && Array.isArray(data.paths) ? data.paths.map(String) : []
    if (!root || !fs.existsSync(root)) return { error: '项目根目录不存在' }
    if (!paths.length) return { error: '缺少 paths 参数（需为数组）' }
    return deleteFilesInRoot(root, paths)
  })

  // 在工作区根目录执行有限白名单命令（npm/yarn/pnpm/bun/nest），支持 workdir 切换子目录
  messageApiInstance.registerHandler('runWorkspaceCommand', async (data) => {
    const command = (data && data.command) != null ? String(data.command) : ''
    const timeoutMs = data && data.timeoutMs
    const workdir = (data && data.workdir) != null ? String(data.workdir) : undefined
    if (!command.trim()) return { error: '缺少 command 参数' }
    return runWorkspaceCommand(command, timeoutMs, workdir)
  })

  // 在用户显式添加的附加项目中执行有限白名单命令
  messageApiInstance.registerHandler('runIdeProjectCommand', async (data) => {
    const root = data?.root != null ? path.resolve(String(data.root)) : ''
    const command = data?.command != null ? String(data.command) : ''
    const timeoutMs = data && data.timeoutMs
    const workdir = data?.workdir != null ? String(data.workdir) : undefined
    if (!root || !fs.existsSync(root)) return { error: '项目根目录不存在' }
    if (!isPathInsideRoot(root, path.resolve(root, workdir || '.'))) {
      return { error: 'workdir 超出项目范围' }
    }
    if (!command.trim()) return { error: '缺少 command 参数' }
    return runCommandInRoot(root, command, timeoutMs, workdir)
  })

  // 根据出码 results 结构在工作区生成多文件/目录；支持 projectMode 产出 HTML + Vite 项目（样式由出码侧处理）
  messageApiInstance.registerHandler('writeWorkspaceFiles', async (data) => {
    const basePath =
      (data && data.basePath) != null ? String(data.basePath) : ''
    let results = data && data.results
    if (!Array.isArray(results))
      return { error: '缺少 results 参数（需为数组）' }
    if (data.projectMode) {
      results = wrapResultsAsProject(results)
    }
    return writeWorkspaceFilesFromResults(basePath, results)
  })
}

module.exports = registerHandlers
