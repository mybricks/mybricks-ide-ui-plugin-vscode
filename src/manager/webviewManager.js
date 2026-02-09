const vscode = require('vscode')
const EventEmitter = require('events')
const WebviewPanel = require('../renderer/webviewPanel')
const registerHandlers = require('../registerHandler')

/**
 * WebviewManager - 集中管理 Webview 生命周期和状态
 * 单例模式，所有地方都通过 getInstance() 获取
 */
class WebviewManager extends EventEmitter {
  constructor() {
    super()
    this.webviewPanel = new WebviewPanel()
    this.context = null
    this.isInitializing = false
    this.initializationPromise = null
    this.currentFilePath = null // 当前打开的 .mybricks 文件路径
  }

  /**
   * 初始化管理器（在扩展激活时调用）
   * @param {vscode.ExtensionContext} context
   */
  initialize(context) {
    this.context = context
    // emit 初始化事件，MCP Server 可以监听此事件
    this.emit('initialized', { context })
  }

  /**
   * 获取或创建 Webview 面板
   * 如果面板不存在，自动创建；如果存在，直接显示
   * @returns {Promise<vscode.WebviewPanel>}
   */
  async ensurePanel() {
    // 如果已经在初始化中，返回现有的 Promise
    if (this.isInitializing) {
      return this.initializationPromise
    }

    // 如果面板已存在，直接返回
    if (this.webviewPanel.getCurrentPanel()) {
      return Promise.resolve(this.webviewPanel.getCurrentPanel())
    }

    // 开始初始化
    this.isInitializing = true
    this.initializationPromise = this.webviewPanel.createOrShow(
      this.context,
      registerHandlers
    )

    try {
      const panel = await this.initializationPromise
      // emit 面板打开事件
      this.emit('panelOpened', { panel })
      return panel
    } finally {
      this.isInitializing = false
      this.initializationPromise = null
    }
  }

  /**
   * 获取 Webview 面板（可能为 undefined）
   * @returns {vscode.WebviewPanel|undefined}
   */
  getPanel() {
    return this.webviewPanel.getCurrentPanel()
  }

  /**
   * 获取 MessageAPI 实例
   * @returns {MessageAPI|undefined}
   */
  getMessageAPI() {
    return this.webviewPanel.getMessageAPI()
  }

  /**
   * 检查 Webview 是否已初始化
   * @returns {boolean}
   */
  isReady() {
    return this.webviewPanel.getCurrentPanel() !== undefined
  }

  /**
   * 获取 WebviewPanel 实例（内部使用）
   * @returns {WebviewPanel}
   */
  getWebviewPanelInstance() {
    return this.webviewPanel
  }

  /**
   * 获取 MyBricksAPI 实例
   * @returns {Proxy|undefined}
   */
  getMyBricksAPI() {
    return this.webviewPanel.getMyBricksAPI()
  }

  /**
   * 设置当前打开的文件路径
   * @param {string|null} filePath - 文件路径
   */
  setCurrentFilePath(filePath) {
    this.currentFilePath = filePath
  }

  /**
   * 获取当前打开的文件路径
   * @returns {string|null}
   */
  getCurrentFilePath() {
    return this.currentFilePath
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
