const fs = require('fs')
const path = require('path')
const vscode = require('vscode')
const MessageAPI = require('../../../utils/messageApi')

/**
 * Webview 面板管理类
 */
class WebviewPanel {
  constructor() {
    this.currentPanel = undefined
    this.messageApiInstance = undefined
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

    return htmlContent
  }

  /**
   * 创建或显示 webview 面板
   * @param {vscode.ExtensionContext} context
   * @param {Function} registerHandlers - 注册事件处理器的函数
   * @returns {Promise<vscode.WebviewPanel>}
   */
  createOrShow(context, registerHandlers) {
    const extensionUri = context.extensionUri

    if (this.currentPanel) {
      // 面板已存在，显示它
      this.currentPanel.reveal(vscode.ViewColumn.One)
      return Promise.resolve(this.currentPanel)
    }

    // 创建新面板并返回 Promise
    return new Promise((resolve) => {
      this.currentPanel = vscode.window.createWebviewPanel(
        'mybricksWeb',
        'MyBricks',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(extensionUri, 'asserts'),
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

      this.currentPanel.webview.html = this.getWebviewContent(
        this.currentPanel.webview,
        extensionUri
      )

      // 创建消息 API 实例并注册处理器
      const messageApiInstance = new MessageAPI(this.currentPanel)
      this.messageApiInstance = messageApiInstance

      // 创建 MyBricksAPI 代理
      this._setupMyBricksAPI()

      if (registerHandlers) {
        registerHandlers(messageApiInstance, context)
      }

      // 关闭侧边栏和底部面板
      vscode.commands.executeCommand('workbench.action.closeSidebar')
      vscode.commands.executeCommand('workbench.action.closePanel')

      // 监听面板显示状态，当面板真正显示时 resolve
      const disposable = this.currentPanel.onDidChangeViewState((e) => {
        if (e.webviewPanel.visible) {
          disposable.dispose()
          resolve(this.currentPanel)
        }
      })

      // 面板关闭时清理
      this.currentPanel.onDidDispose(() => {
        this.currentPanel = undefined
        this.messageApiInstance = undefined
        disposable.dispose()
      })

      // 如果面板已经可见，立即 resolve
      if (this.currentPanel.visible) {
        disposable.dispose()
        resolve(this.currentPanel)
      }
    })
  }

  /**
   * 获取当前面板实例
   * @returns {vscode.WebviewPanel|undefined}
   */
  getCurrentPanel() {
    return this.currentPanel
  }

  /**
   * 获取 MessageAPI 实例
   * @returns {MessageAPI|undefined}
   */
  getMessageAPI() {
    return this.messageApiInstance
  }

  /**
   * 设置 MyBricksAPI 代理
   * @private
   */
  _setupMyBricksAPI() {
    if (!this.currentPanel) {
      return
    }

    const createApiProxy = (path = []) => {
      return new Proxy(function apiFunction() {}, {
        get: (target, prop, receiver) => {
          if (prop === Symbol.toStringTag || prop === Symbol.hasInstance || prop === 'constructor' || prop === 'prototype') {
            return target[prop]
          }
          
          const currentPath = [...path, String(prop)]
          return createApiProxy(currentPath)
        },
        
        apply: async (target, thisArg, args) => {
          const fullMethodName = path.join('.')
          
          if (!this.messageApiInstance) {
            throw new Error('MessageAPI 未初始化')
          }
          
          try {
            const result = await this.messageApiInstance.callWebview('callGlobalApi', {
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
    
    this.currentPanel.webview.MyBricksAPI = createApiProxy()
  }

  /**
   * 获取 MyBricksAPI 实例
   * @returns {Proxy|undefined}
   */
  getMyBricksAPI() {
    return this.currentPanel?.webview?.MyBricksAPI
  }
}

module.exports = WebviewPanel
