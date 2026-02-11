const fs = require('fs')
const path = require('path')
const vscode = require('vscode')
const MessageAPI = require('../../../utils/messageApi')
const { getPreferredExtension } = require('../../fileExtension')

const UNNAMED_KEY = '__unnamed__'

/**
 * Webview 面板管理类（支持多文件多面板，按文件路径区分）
 */
class WebviewPanel {
  constructor() {
    /** @type {Map<string, { panel: vscode.WebviewPanel, messageApiInstance: MessageAPI }>} */
    this.panelsByFilePath = new Map()
    /** @type {Map<string, Promise<vscode.WebviewPanel>>} */
    this.pendingByFilePath = new Map()
  }

  _normalizeKey(filePath) {
    if (!filePath) return UNNAMED_KEY
    return path.normalize(filePath)
  }

  /**
   * 获取 webview HTML 内容
   * @param {vscode.Webview} webview
   * @param {vscode.Uri} extensionUri
   * @returns {string}
   */
  getWebviewContent(webview, extensionUri) {
    const htmlPath = path.join(__dirname, 'index.html')
    let htmlContent = fs.readFileSync(htmlPath, 'utf8')

    // 将 ./asserts/... 等本地相对路径转成 webview 资源 URI
    htmlContent = htmlContent.replace(
      /\.\/asserts\/([^"'\s)]+)/g,
      (_, relPath) => {
        const resourceUri = vscode.Uri.joinPath(
          extensionUri,
          'asserts',
          relPath
        )
        return webview.asWebviewUri(resourceUri).toString()
      }
    )

    // 将 ./out/webview/... 路径转成 webview 资源 URI
    htmlContent = htmlContent.replace(
      /\.\/out\/webview\/([^"'\s)]+)/g,
      (_, relPath) => {
        const resourceUri = vscode.Uri.joinPath(
          extensionUri,
          'out',
          'webview',
          relPath
        )
        return webview.asWebviewUri(resourceUri).toString()
      }
    )

    return htmlContent
  }

  /**
   * 根据文件路径取 webview 标题（文件名+扩展名，未命名时显示 未命名文件 + 优先后缀）
   * @param {string|null} filePath
   * @returns {string}
   */
  _getPanelTitle(filePath) {
    if (filePath) {
      return path.basename(filePath)
    }
    return '未命名文件' + getPreferredExtension()
  }

  /**
   * 创建或显示指定文件对应的 webview 面板（同一文件复用同一面板，不同文件不同面板）
   * @param {vscode.ExtensionContext} context
   * @param {Function} registerHandlers - 注册事件处理器的函数
   * @param {string|null} [filePath] - 当前打开的设计文件路径（.ui / .mybricks），null 表示“未关联文件”的通用面板
   * @param {function(string|null): void} [onPanelActive] - 当某面板变为可见时回调，参数为该面板对应的 filePath
   * @returns {Promise<vscode.WebviewPanel>}
   */
  createOrShow(context, registerHandlers, filePath, onPanelActive) {
    const key = this._normalizeKey(filePath)
    const extensionUri = context.extensionUri
    const title = this._getPanelTitle(filePath)

    const existing = this.panelsByFilePath.get(key)
    if (existing) {
      existing.panel.title = title
      existing.panel.reveal(vscode.ViewColumn.One)
      if (onPanelActive) onPanelActive(filePath)
      return Promise.resolve(existing.panel)
    }

    const pending = this.pendingByFilePath.get(key)
    if (pending) return pending

    const promise = new Promise((resolve) => {
      const panel = vscode.window.createWebviewPanel(
        'mybricksWeb',
        title,
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(extensionUri, 'asserts'),
            vscode.Uri.joinPath(extensionUri, 'out'),
            extensionUri,
          ],
          portMapping: [
            { webviewPort: 20000, extensionHostPort: 20000 },
            { webviewPort: 3000, extensionHostPort: 3000 },
            { webviewPort: 8080, extensionHostPort: 8080 },
          ],
          enableCommandUris: true,
        }
      )

      panel.mybricksFilePath = filePath
      panel.webview.html = this.getWebviewContent(panel.webview, extensionUri)

      const messageApiInstance = new MessageAPI(panel)
      this._setupMyBricksAPI(panel, messageApiInstance)

      if (registerHandlers) {
        registerHandlers(messageApiInstance, context)
      }

      vscode.commands.executeCommand('workbench.action.closeSidebar')
      vscode.commands.executeCommand('workbench.action.closePanel')

      const viewStateDisposable = panel.onDidChangeViewState((e) => {
        if (e.webviewPanel.visible && onPanelActive) {
          onPanelActive(e.webviewPanel.mybricksFilePath)
        }
      })

      panel.onDidDispose(() => {
        this.panelsByFilePath.delete(key)
        this.pendingByFilePath.delete(key) // 清除 pending，否则再次打开会拿到已失效的 promise
        viewStateDisposable.dispose()
      })

      this.panelsByFilePath.set(key, { panel, messageApiInstance })
      this.pendingByFilePath.delete(key)
      if (onPanelActive && panel.visible) onPanelActive(filePath)

      const resolveOnce = (p) => {
        resolve(p)
        viewStateDisposable.dispose()
      }
      if (panel.visible) {
        resolveOnce(panel)
      } else {
        const disposable = panel.onDidChangeViewState((e) => {
          if (e.webviewPanel.visible) {
            disposable.dispose()
            resolveOnce(panel)
          }
        })
      }
    })

    this.pendingByFilePath.set(key, promise)
    return promise
  }

  /**
   * 获取指定文件路径对应的面板（不传则返回任意一个，用于兼容无文件场景）
   * @param {string|null} [filePath]
   * @returns {vscode.WebviewPanel|undefined}
   */
  getPanel(filePath) {
    const key = filePath != null ? this._normalizeKey(filePath) : null
    if (key !== null) {
      return this.panelsByFilePath.get(key)?.panel
    }
    const first = this.panelsByFilePath.values().next().value
    return first?.panel
  }

  /**
   * 是否存在任意一个面板
   * @returns {boolean}
   */
  hasAnyPanel() {
    return this.panelsByFilePath.size > 0
  }

  /**
   * 获取指定文件路径对应的 MessageAPI
   * @param {string|null} [filePath]
   * @returns {MessageAPI|undefined}
   */
  getMessageAPI(filePath) {
    const key = filePath != null ? this._normalizeKey(filePath) : null
    if (key !== null) {
      return this.panelsByFilePath.get(key)?.messageApiInstance
    }
    const first = this.panelsByFilePath.values().next().value
    return first?.messageApiInstance
  }

  /**
   * 设置 MyBricksAPI 代理
   * @private
   * @param {vscode.WebviewPanel} panel
   * @param {MessageAPI} messageApiInstance
   */
  _setupMyBricksAPI(panel, messageApiInstance) {
    if (!panel || !messageApiInstance) return

    const createApiProxy = (pathSegments = []) => {
      return new Proxy(function apiFunction() {}, {
        get: (target, prop, receiver) => {
          if (prop === Symbol.toStringTag || prop === Symbol.hasInstance || prop === 'constructor' || prop === 'prototype') {
            return target[prop]
          }
          const currentPath = [...pathSegments, String(prop)]
          return createApiProxy(currentPath)
        },
        apply: async (target, thisArg, args) => {
          const fullMethodName = pathSegments.join('.')
          try {
            const result = await messageApiInstance.callWebview('callGlobalApi', {
              methodName: fullMethodName,
              args: args
            })
            return result
          } catch (error) {
            throw new Error(`调用 MyBricksAPI.${fullMethodName} 失败: ${error.message}`)
          }
        }
      })
    }
    panel.webview.MyBricksAPI = createApiProxy()
  }

  /**
   * 获取指定文件路径对应面板的 MyBricksAPI
   * @param {string|null} [filePath]
   * @returns {Proxy|undefined}
   */
  getMyBricksAPI(filePath) {
    const p = this.getPanel(filePath)
    return p?.webview?.MyBricksAPI
  }
}

module.exports = WebviewPanel
