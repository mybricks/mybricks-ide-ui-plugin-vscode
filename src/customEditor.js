const fs = require('fs')
const path = require('path')
const vscode = require('vscode')
const { stopProxyServer } = require('./proxy-server')
const MessageAPI = require('../utils/messageApi')
const registerHandlers = require('./registerHandler')
const { getInstance: getWebviewManager } = require('./manager/webviewManager')

/**
 * MyBricksEditorProvider - 基于 vscode.CustomEditorProvider 的自定义编辑器
 *
 * 每次用户打开 .ui / .mybricks 文件时，VSCode 会调用 resolveCustomEditor，
 * 为该文件创建一个独立的 WebviewPanel，天然支持多文件多标签。
 */
class MyBricksEditorProvider {
  /** @param {vscode.ExtensionContext} context */
  constructor(context) {
    this.context = context
    /**
     * 驱动 VSCode 标签脏状态（圆点）和关闭前保存弹窗的事件发射器
     * @type {vscode.EventEmitter<vscode.CustomDocumentContentChangeEvent<vscode.CustomDocument>>}
     */
    this._onDidChangeCustomDocument = new vscode.EventEmitter()
    /** VSCode 通过此事件感知文档变脏 */
    this.onDidChangeCustomDocument = this._onDidChangeCustomDocument.event
    /**
     * 已打开文件的 CustomDocument 映射（filePath → document）
     * 用于 notifyContentChanged 时 fire 正确的 document 引用
     * @type {Map<string, vscode.CustomDocument>}
     */
    this.documentMap = new Map()
  }

  /**
   * VSCode 在打开文件时首先调用此方法创建 CustomDocument
   * @param {vscode.Uri} uri
   * @param {vscode.CustomDocumentOpenContext} _openContext
   * @param {vscode.CancellationToken} _token
   * @returns {vscode.CustomDocument}
   */
  openCustomDocument(uri, _openContext, _token) {
    const document = { uri, dispose: () => {} }
    this.documentMap.set(uri.fsPath, document)
    return document
  }

  /**
   * VSCode 会在打开自定义编辑器文件时调用此方法
   * @param {vscode.CustomDocument} document
   * @param {vscode.WebviewPanel} webviewPanel
   * @param {vscode.CancellationToken} _token
   */
  resolveCustomEditor(document, webviewPanel, _token) {
    const filePath = document.uri.fsPath
    const extensionUri = this.context.extensionUri

    // 配置 webview
    webviewPanel.webview.options = {
      enableScripts: true,
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

    webviewPanel.webview.html = this._getWebviewContent(webviewPanel.webview, extensionUri)

    const messageApiInstance = new MessageAPI(webviewPanel)
    this._setupMyBricksAPI(webviewPanel, messageApiInstance)

    // 注册该面板的所有消息处理器（filePath 绑定到此文档）
    registerHandlers(messageApiInstance, this.context, filePath)

    // 关闭侧边栏/底部面板（与原逻辑保持一致）
    vscode.commands.executeCommand('workbench.action.closeSidebar')
    vscode.commands.executeCommand('workbench.action.closePanel')

    // 打开文件时关闭 VSCode 面包屑导航
    vscode.workspace.getConfiguration().update('breadcrumbs.enabled', false, vscode.ConfigurationTarget.Global)

    // 前端通知内容变更 → fire onDidChangeCustomDocument → VSCode 标签显示脏圆点
    messageApiInstance.registerHandler('notifyContentChanged', () => {
      markFileDirty(filePath)
      return null
    })

    // 注册到 webviewManager，便于 MCP / config 变更等全局广播
    const webviewManager = getWebviewManager()
    webviewManager.registerPanel(filePath, webviewPanel, messageApiInstance)

    webviewPanel.onDidDispose(() => {
      this.documentMap.delete(filePath)
      webviewManager.unregisterPanel(filePath)
      messageApiInstance.dispose()
      // 只有最后一个 .ui 面板关闭时，才恢复面包屑导航并停止代理服务
      if (webviewManager.panelMap.size === 0) {
        vscode.workspace.getConfiguration().update('breadcrumbs.enabled', true, vscode.ConfigurationTarget.Global)
        stopProxyServer().catch(() => {})
      }
    })

    webviewPanel.onDidChangeViewState((e) => {
      if (e.webviewPanel.visible) {
        webviewManager.setCurrentFilePath(filePath)
      }
    })

    if (webviewPanel.visible) {
      webviewManager.setCurrentFilePath(filePath)
    }
  }

  /**
   * 生成 webview HTML（将本地资源路径替换为 webview URI）
   * @param {vscode.Webview} webview
   * @param {vscode.Uri} extensionUri
   * @returns {string}
   */
  _getWebviewContent(webview, extensionUri) {
    const htmlPath = path.join(__dirname, 'renderer', 'webviewPanel', 'index.html')
    let html = fs.readFileSync(htmlPath, 'utf8')

    html = html.replace(/\.\/asserts\/([^"'\s)]+)/g, (_, relPath) =>
      webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'asserts', relPath)).toString()
    )
    html = html.replace(/\.\/out\/webview\/([^"'\s)]+)/g, (_, relPath) =>
      webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'out', 'webview', relPath)).toString()
    )

    return html
  }

  /**
   * 设置 MyBricksAPI 代理（透传到前端 callGlobalApi）
   * @param {vscode.WebviewPanel} panel
   * @param {MessageAPI} messageApiInstance
   */
  _setupMyBricksAPI(panel, messageApiInstance) {
    const createApiProxy = (pathSegments = []) =>
      new Proxy(function () {}, {
        get: (target, prop) => {
          if (
            prop === Symbol.toStringTag ||
            prop === Symbol.hasInstance ||
            prop === 'constructor' ||
            prop === 'prototype'
          )
            return target[prop]
          return createApiProxy([...pathSegments, String(prop)])
        },
        apply: async (_target, _thisArg, args) => {
          const fullMethodName = pathSegments.join('.')
          try {
            return await messageApiInstance.callWebview('callGlobalApi', {
              methodName: fullMethodName,
              args,
            })
          } catch (error) {
            throw new Error(`调用 MyBricksAPI.${fullMethodName} 失败: ${error.message}`)
          }
        },
      })
    panel.webview.MyBricksAPI = createApiProxy()
  }

  /**
   * 注册 CustomEditorProvider，并将实例存入模块单例
   * @param {vscode.ExtensionContext} context
   */
  static register(context) {
    const provider = new MyBricksEditorProvider(context)
    // CustomEditorProvider（可写）：onDidChangeCustomDocument 驱动标签脏状态与关闭弹窗
    // saveCustomDocument 由 Ctrl+S 触发，通知前端执行保存
    const disposable = vscode.window.registerCustomEditorProvider(
      'mybricks.editor',
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      }
    )
    context.subscriptions.push(disposable)
    _providerInstance = provider
    return provider
  }

  // ─── CustomEditorProvider 写操作接口 ──────────────────────────────────────

  /**
   * Ctrl+S 触发时由 VSCode 调用，向对应 webview 发送 triggerSave 通知
   * @param {vscode.CustomDocument} document
   */
  saveCustomDocument(document) {
    const filePath = document.uri.fsPath
    const webviewManager = getWebviewManager()
    const messageApiInstance = webviewManager.getMessageAPIByFilePath(filePath)
    if (messageApiInstance) {
      try {
        messageApiInstance.notifyWebview('triggerSave', {})
      } catch (e) {
        // 面板可能已销毁，忽略错误
      }
    }
    return Promise.resolve()
  }

  /** @param {vscode.CustomDocument} document @param {vscode.Uri} destination */
  saveCustomDocumentAs(document, destination) {
    return Promise.resolve()
  }

  /** @param {vscode.CustomDocument} document */
  revertCustomDocument(document) {
    return Promise.resolve()
  }

  /** @param {vscode.CustomDocument} document @param {vscode.CustomDocumentBackupContext} context */
  backupCustomDocument(document, context) {
    return Promise.resolve({ id: context.destination.toString(), delete() {} })
  }
}

// 模块级单例引用，由 MyBricksEditorProvider.register() 写入
/** @type {MyBricksEditorProvider | null} */
let _providerInstance = null

/**
 * 将指定文件路径对应的文档标记为已修改（脏状态）。
 * 触发 VSCode 在标签上显示圆点，并在关闭时弹出保存提醒。
 *
 * @param {string} filePath - 文件的绝对路径（fsPath）
 */
function markFileDirty(filePath) {
  if (!_providerInstance) return
  const doc = _providerInstance.documentMap.get(require('path').normalize(filePath))
  if (doc) {
    _providerInstance._onDidChangeCustomDocument.fire({ document: doc })
  }
}

/**
 * 保持向后兼容：供 subscriptions.js 调用
 * @param {vscode.ExtensionContext} context
 */
function registerCustomEditor(context) {
  MyBricksEditorProvider.register(context)
}

module.exports = {
  registerCustomEditor,
  MyBricksEditorProvider,
  markFileDirty,
}
