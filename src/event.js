const fs = require('fs')
const vscode = require('vscode')
const { getInstance: getWebviewManager } = require('./manager/webviewManager')

/**
 * 处理侧边栏消息事件
 * @param {vscode.WebviewView} webviewView - 侧边栏视图
 * @param {vscode.ExtensionContext} context - 扩展上下文
 */
function handleSidebarMessage(webviewView, context) {
  const webviewManager = getWebviewManager()

  // 监听 WebviewManager 的 recentFilesUpdated 事件，通知侧边栏更新
  const updateListener = (recentFiles) => {
    webviewView.webview.postMessage({
      command: 'updateRecentFiles',
      data: recentFiles
    })
  }
  webviewManager.on('recentFilesUpdated', updateListener)

  // 当 Webview 销毁时，移除监听器
  webviewView.onDidDispose(() => {
    webviewManager.removeListener('recentFilesUpdated', updateListener)
  })

  // 监听侧边栏消息
  webviewView.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.command) {
        // 打开 MyBricks IDE
        case 'openIDE':
          vscode.commands.executeCommand('mybricks.openIDE')
          break
        
        // 获取最近文件列表
        case 'getRecentFiles':
          const recentFiles = webviewManager.getRecentFiles() || []
          webviewView.webview.postMessage({
            command: 'updateRecentFiles',
            data: recentFiles
          })
          break

        // 打开最近文件
        case 'openRecentFile':
          const filePath = message.filePath
          if (fs.existsSync(filePath)) {
            // 文件存在，打开它
            // 通过 mybricks.openFile 命令打开
            vscode.commands.executeCommand('mybricks.openFile', vscode.Uri.file(filePath))
          } else {
            // 文件不存在，从最近列表中移除
            webviewManager.removeRecentFile(filePath)
            vscode.window.showErrorMessage(`文件 ${filePath} 不存在，已从最近列表中移除`)
          }
          break
      }
    },
    undefined,
    context.subscriptions
  )
}

module.exports = {
  handleSidebarMessage,
}

