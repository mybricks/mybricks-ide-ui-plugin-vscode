const vscode = require('vscode')
const path = require('path')

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

      if (pathName === 'open') {
        const filePathParam = query.get('path') || null
        if (filePathParam && vscode.workspace.workspaceFolders?.length) {
          try {
            const decoded = decodeURIComponent(filePathParam)
            const firstRoot = vscode.workspace.workspaceFolders[0].uri.fsPath
            const absolutePath = decoded.startsWith(firstRoot)
              ? decoded
              : path.join(firstRoot, decoded)
            // CustomEditor 模式：直接用 vscode.open 打开文件，VSCode 会自动使用 mybricks.editor
            const uri = vscode.Uri.file(absolutePath)
            vscode.commands.executeCommand('vscode.open', uri, { preview: false })
          } catch (_) {
            vscode.window.showErrorMessage('无法打开指定的设计文件，请检查路径是否正确。')
          }
        } else {
          // 无文件参数时，打开文件选择对话框
          vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectMany: false,
            filters: { 'MyBricks 设计文件': ['ui', 'mybricks'] },
            title: '打开 MyBricks 设计文件',
          }).then((uris) => {
            if (uris && uris[0]) {
              vscode.commands.executeCommand('vscode.open', uris[0], { preview: false })
            }
          })
        }
      }
    },
  }

  return vscode.window.registerUriHandler(uriHandler)
}

module.exports = {
  registerUriHandler,
}
