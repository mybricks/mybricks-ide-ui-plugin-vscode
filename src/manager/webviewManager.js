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
    this.currentFilePath = null // 当前“激活”的文件路径（最后打开或最后聚焦的面板对应文件）
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
   * 获取或创建当前文件对应的 Webview 面板（不同文件对应不同面板）
   * @returns {Promise<vscode.WebviewPanel>}
   */
  async ensurePanel() {
    const panel = await this.webviewPanel.createOrShow(
      this.context,
      registerHandlers,
      this.currentFilePath,
      (filePath) => {
        this.currentFilePath = filePath
      }
    )
    this.emit('panelOpened', { panel })
    return panel
  }

  /**
   * 获取当前“激活”文件对应的 Webview 面板（无当前文件时返回任意已存在面板）
   * @returns {vscode.WebviewPanel|undefined}
   */
  getPanel() {
    return this.webviewPanel.getPanel(this.currentFilePath)
  }

  /**
   * 获取当前“激活”文件对应的 MessageAPI
   * @returns {MessageAPI|undefined}
   */
  getMessageAPI() {
    return this.webviewPanel.getMessageAPI(this.currentFilePath)
  }

  /**
   * 是否有任意一个 Webview 面板已打开
   * @returns {boolean}
   */
  isReady() {
    return this.webviewPanel.hasAnyPanel()
  }

  /**
   * 获取 WebviewPanel 实例（内部使用）
   * @returns {WebviewPanel}
   */
  getWebviewPanelInstance() {
    return this.webviewPanel
  }

  /**
   * 获取当前“激活”文件对应面板的 MyBricksAPI
   * @returns {Proxy|undefined}
   */
  getMyBricksAPI() {
    return this.webviewPanel.getMyBricksAPI(this.currentFilePath)
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
