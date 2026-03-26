const vscode = require('vscode')
const EventEmitter = require('events')
const path = require('path')
const { STATE_KEYS } = require('../../utils/constants')

/**
 * WebviewManager - 集中管理 CustomEditor Webview 生命周期和状态
 * 单例模式，所有地方都通过 getInstance() 获取
 */
class WebviewManager extends EventEmitter {
  constructor() {
    super()
    this.context = null
    /**
     * 每个已打开文件的面板与消息 API 映射
     * @type {Map<string, { panel: vscode.WebviewPanel, messageApiInstance: import('../../utils/messageApi') }>}
     */
    this.panelMap = new Map()
    /** 当前"激活"的文件路径（最后聚焦/打开的面板所对应的文件） */
    this.currentFilePath = null
    /** 由 vscode:// URI 传入的待打开路径，供 openIDE 命令一次性消费 */
    this.pendingFilePathFromUri = null
  }

  /**
   * 初始化管理器（在扩展激活时调用）
   * @param {vscode.ExtensionContext} context
   */
  initialize(context) {
    this.context = context
    this.emit('initialized', { context })
  }

  // ─── Panel 注册 / 注销 ────────────────────────────────────────────────────

  /**
   * 注册一个已创建的 CustomEditor 面板
   * @param {string} filePath
   * @param {vscode.WebviewPanel} panel
   * @param {import('../../utils/messageApi')} messageApiInstance
   */
  registerPanel(filePath, panel, messageApiInstance) {
    const key = this._normalize(filePath)
    this.panelMap.set(key, { panel, messageApiInstance })
    this.currentFilePath = filePath
    this.addRecentFile(filePath)
    this.emit('panelOpened', { panel, filePath })
  }

  /**
   * 注销一个 CustomEditor 面板（关闭时调用）
   * @param {string} filePath
   */
  unregisterPanel(filePath) {
    const key = this._normalize(filePath)
    this.panelMap.delete(key)
    if (this._normalize(this.currentFilePath) === key) {
      // 切换到最后一个剩余面板（如果有）
      const last = [...this.panelMap.values()].pop()
      this.currentFilePath = last ? this._getFilePathByEntry(last) : null
    }
  }

  // ─── 查询 ─────────────────────────────────────────────────────────────────

  /**
   * 获取当前"激活"文件对应的面板
   * @returns {vscode.WebviewPanel|undefined}
   */
  getPanel() {
    const key = this._normalize(this.currentFilePath)
    return this.panelMap.get(key)?.panel
  }

  /**
   * 获取当前"激活"文件对应的 MessageAPI
   * @returns {import('../../utils/messageApi')|undefined}
   */
  getMessageAPI() {
    const key = this._normalize(this.currentFilePath)
    return this.panelMap.get(key)?.messageApiInstance
  }

  /**
   * 根据文件路径获取对应的 MessageAPI
   * @param {string} filePath
   * @returns {import('../../utils/messageApi')|undefined}
   */
  getMessageAPIByFilePath(filePath) {
    const key = this._normalize(filePath)
    return this.panelMap.get(key)?.messageApiInstance
  }

  /**
   * 是否有任意一个面板已打开
   * @returns {boolean}
   */
  isReady() {
    return this.panelMap.size > 0
  }

  // ─── 广播 ─────────────────────────────────────────────────────────────────

  /**
   * 向所有已打开的面板广播通知（例如配置变更）
   * @param {string} event
   * @param {any} data
   */
  notifyAllPanels(event, data = {}) {
    for (const { messageApiInstance } of this.panelMap.values()) {
      try {
        messageApiInstance.notifyWebview(event, data)
      } catch (e) {
        // 面板可能已销毁，忽略错误
      }
    }
  }

  // ─── 重新加载 ─────────────────────────────────────────────────────────────

  /**
   * 重新加载指定文件路径对应面板的 HTML（触发完整刷新）
   * 由 registerHandler 中的 reloadWebview 处理器调用
   * @param {string|null} filePath
   * @returns {boolean}
   */
  reloadPanel(filePath) {
    const key = this._normalize(filePath)
    const entry = this.panelMap.get(key)
    if (!entry) return false

    // 动态 require 避免循环依赖
    const path_ = require('path')
    const fs = require('fs')
    const htmlPath = path_.join(__dirname, '../renderer/webviewPanel/index.html')
    let html = fs.readFileSync(htmlPath, 'utf8')
    const extensionUri = this.context.extensionUri
    html = html.replace(/\.\/asserts\/([^"'\s)]+)/g, (_, relPath) =>
      entry.panel.webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'asserts', relPath)).toString()
    )
    html = html.replace(/\.\/out\/webview\/([^"'\s)]+)/g, (_, relPath) =>
      entry.panel.webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'out', 'webview', relPath)).toString()
    )
    // 先置空再赋值，强制 VSCode 感知内容变化并触发 webview 重载
    entry.panel.webview.html = ''
    entry.panel.webview.html = html
    return true
  }

  // ─── 最近文件 ─────────────────────────────────────────────────────────────

  /**
   * 添加最近打开的文件
   * @param {string} filePath
   */
  async addRecentFile(filePath) {
    if (!this.context || !filePath) return
    const maxCount = 10
    let recentFiles = this.context.globalState.get(STATE_KEYS.RECENT_FILES, [])
    recentFiles = recentFiles.filter((f) => f !== filePath)
    recentFiles.unshift(filePath)
    if (recentFiles.length > maxCount) recentFiles = recentFiles.slice(0, maxCount)
    await this.context.globalState.update(STATE_KEYS.RECENT_FILES, recentFiles)
    this.emit('recentFilesUpdated', this.getRecentFiles())
  }

  /**
   * 获取最近打开的文件列表
   * @returns {string[]}
   */
  getRecentFiles() {
    if (!this.context) return []
    return this.context.globalState.get(STATE_KEYS.RECENT_FILES, [])
  }

  /**
   * 移除最近打开的文件
   * @param {string} filePath
   */
  async removeRecentFile(filePath) {
    if (!this.context) return
    let recentFiles = this.context.globalState.get(STATE_KEYS.RECENT_FILES, [])
    recentFiles = recentFiles.filter((f) => f !== filePath)
    await this.context.globalState.update(STATE_KEYS.RECENT_FILES, recentFiles)
    this.emit('recentFilesUpdated', this.getRecentFiles())
  }

  // ─── 当前文件路径 ─────────────────────────────────────────────────────────

  /**
   * @param {string|null} filePath
   */
  setCurrentFilePath(filePath) {
    this.currentFilePath = filePath
  }

  /**
   * @returns {string|null}
   */
  getCurrentFilePath() {
    return this.currentFilePath
  }

  /**
   * 设置由 URI 传入的待打开路径（由 openIDE 命令消费一次）
   * @param {string|null} filePath
   */
  setPendingFilePathFromUri(filePath) {
    this.pendingFilePathFromUri = filePath
  }

  /**
   * 取走并清除 pending path（供 openIDE 命令使用）
   * @returns {string|null}
   */
  takePendingFilePathFromUri() {
    const p = this.pendingFilePathFromUri
    this.pendingFilePathFromUri = null
    return p
  }

  // ─── 私有工具 ─────────────────────────────────────────────────────────────

  _normalize(filePath) {
    if (!filePath) return '__unnamed__'
    return path.normalize(filePath)
  }

  _getFilePathByEntry(entry) {
    for (const [key, e] of this.panelMap.entries()) {
      if (e === entry) return key === '__unnamed__' ? null : key
    }
    return null
  }
}

// 单例实例
let instance = null

/**
 * 获取 WebviewManager 单例
 * @returns {WebviewManager}
 */
function getInstance() {
  if (!instance) {
    instance = new WebviewManager()
  }
  return instance
}

module.exports = {
  getInstance,
  WebviewManager,
}
