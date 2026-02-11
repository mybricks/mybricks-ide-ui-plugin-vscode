const vscode = require('vscode')
const path = require('path')
const { getInstance: getWebviewManager } = require('./manager/webviewManager')

/**
 * 注册 URI Handler，使浏览器或外部可通过 vscode:// 链接唤起 Cursor/VSCode 并执行命令
 *
 * 链接格式（Cursor 会接管 vscode:// 协议）：
 * - 打开 MyBricks 设计器: vscode://mybricks.mybricks-webview/open
 * - 打开并加载指定文件: vscode://mybricks.mybricks-webview/open?path=<相对或绝对路径>
 *
 * 浏览器中可放置链接或按钮，例如：
 * <a href="vscode://mybricks.mybricks-webview/open">在 IDE 中打开</a>
 * 或 window.open('vscode://mybricks.mybricks-webview/open')
 *
 * @param {vscode.ExtensionContext} context
 * @returns {vscode.Disposable}
 */
function registerUriHandler(context) {
  const uriHandler = {
    handleUri(uri) {
      const pathName = (uri.path || '').replace(/^\/+/, '') || 'open'
      const query = new URLSearchParams(uri.query || '')
      const webviewManager = getWebviewManager()

      if (pathName === 'open') {
        const filePathParam = query.get('path') || null
        if (filePathParam && vscode.workspace.workspaceFolders?.length) {
          try {
            const decoded = decodeURIComponent(filePathParam)
            const firstRoot = vscode.workspace.workspaceFolders[0].uri.fsPath
            const absolutePath = decoded.startsWith(firstRoot)
              ? decoded
              : path.join(firstRoot, decoded)
            webviewManager.setPendingFilePathFromUri(absolutePath)
          } catch (_) {
            webviewManager.setPendingFilePathFromUri(null)
          }
        } else {
          webviewManager.setPendingFilePathFromUri(null)
        }
        vscode.commands.executeCommand('mybricks.openIDE')
      }
    },
  }

  return vscode.window.registerUriHandler(uriHandler)
}

module.exports = {
  registerUriHandler,
}
