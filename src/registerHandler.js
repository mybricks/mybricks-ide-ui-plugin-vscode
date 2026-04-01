const vscode = require('vscode')
const path = require('path')
const fs = require('fs')
const axios = require('axios')

const { isMybricksFile, getPreferredExtension } = require('./fileExtension')
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
  writeWorkspaceFilesFromResults,
  getWorkspaceRoot,
} = require('../utils/workspaceFiles')
const { wrapResultsAsProject } = require('../utils/projectModeOutput')
const { STATE_KEYS } = require('../utils/constants')
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
      vscode.workspace.getConfiguration('mybricks').get('mcp.enabled') === true
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
      const {
        getInstance: getWebviewManager,
      } = require('./manager/webviewManager')
      const webviewManager = getWebviewManager()
      const currentFilePath = webviewManager.getCurrentFilePath()
      webviewManager.reloadPanel(currentFilePath)
    })
    return { success: true }
  })

  // 读取 AI 请求凭证（Token）
  messageApiInstance.registerHandler('getAIToken', () => {
    const token = vscode.workspace.getConfiguration('mybricks').get('ai.token')
    return typeof token === 'string' ? token : ''
  })

  // 打开设置页并定位到 MyBricks AI Token 配置项
  messageApiInstance.registerHandler('openAISettings', async () => {
    await vscode.commands.executeCommand(
      'workbench.action.openSettings',
      'mybricks.ai.token',
    )
  })

  // 获取优先后缀（新建/另存为默认，如 .ui）
  messageApiInstance.registerHandler('getPreferredFileExtension', () =>
    getPreferredExtension(),
  )

  // 获取低码项目内容（返回 { content, path }，path 为当前项目文件路径，无则 null）
  messageApiInstance.registerHandler('getFileContent', async () => {
    const {
      getInstance: getWebviewManager,
    } = require('./manager/webviewManager')
    const webviewManager = getWebviewManager()
    let currentFilePath = webviewManager.getCurrentFilePath()
    // 若未通过设计文件打开设计器，则尝试从当前活动编辑器或已打开的设计文档取路径
    if (!currentFilePath) {
      const activeDoc = vscode.window.activeTextEditor?.document
      if (activeDoc && isMybricksFile(activeDoc.fileName)) {
        currentFilePath = activeDoc.uri.fsPath
      } else {
        const designDoc = vscode.workspace.textDocuments.find(
          (d) => d.uri.scheme === 'file' && isMybricksFile(d.fileName),
        )
        if (designDoc) currentFilePath = designDoc.uri.fsPath
      }
    }
    return getFileContent(context, currentFilePath)
  })

  // 保存低码项目
  messageApiInstance.registerHandler('saveFileContent', async (data) => {
    saveFileContent(context, data)
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
    const {
      getInstance: getWebviewManager,
    } = require('./manager/webviewManager')
    const webviewManager = getWebviewManager()
    const saveContent = data?.saveContent != null ? data.saveContent : data
    let currentFilePath =
      data?.currentFilePath ?? webviewManager.getCurrentFilePath()
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
    }
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
    const {
      getInstance: getWebviewManager,
    } = require('./manager/webviewManager')
    const webviewManager = getWebviewManager()
    let currentFilePath = webviewManager.getCurrentFilePath()
    if (!currentFilePath) {
      const activeDoc = vscode.window.activeTextEditor?.document
      if (activeDoc && isMybricksFile(activeDoc.fileName)) {
        currentFilePath = activeDoc.uri.fsPath
      } else {
        const designDoc = vscode.workspace.textDocuments.find(
          (d) => d.uri.scheme === 'file' && isMybricksFile(d.fileName),
        )
        if (designDoc) currentFilePath = designDoc.uri.fsPath
      }
    }
    const root = getWorkspaceRoot()
    if (!currentFilePath) {
      console.log('[导出] getCurrentExportDefaults: 无当前设计文件，返回默认', {
        projectName: 'my_project',
        exportDir: '.',
      })
      return { projectName: 'my_project', exportDir: '.' }
    }
    const dir = path.dirname(currentFilePath)
    let exportDir = path.relative(root, dir)
    if (!exportDir || exportDir.startsWith('..')) exportDir = '.'
    const projectName =
      path.basename(currentFilePath, path.extname(currentFilePath)) ||
      'my_project'
    const res = { projectName, exportDir }
    console.log('[导出] getCurrentExportDefaults', {
      currentFilePath,
      root,
      res,
    })
    return res
  })

  // 切换 AI 渠道前弹出 VSCode 原生确认弹窗，返回用户的选择
  messageApiInstance.registerHandler('confirmChannelSwitch', async () => {
    const choice = await vscode.window.showWarningMessage(
      '切换 AI 渠道需要刷新设计器，当前未保存的内容将会丢失。',
      { modal: true },
      '保存并刷新'
    )
    if (choice === '保存并刷新') return { action: 'save_and_reload' }
    return { action: 'cancel' }
  })

  // AI 设置（channel、token、custom 配置）存储到 globalState
  messageApiInstance.registerHandler('getAISetting', async () => {
    const existing = context.globalState.get('mybricks.aiSetting', null)
    // 兼容旧版：首次迁移时把 VSCode settings 里的 mybricks.ai.token 写入新格式
    if (!existing?.mybricksAiToken) {
      const oldToken = vscode.workspace.getConfiguration('mybricks').get('ai.token')
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
