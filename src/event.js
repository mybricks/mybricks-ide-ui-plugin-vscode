const fs = require('fs')
const path = require('path')
const vscode = require('vscode')
const { getInstance: getWebviewManager } = require('./manager/webviewManager')
const { getPreferredExtension } = require('./fileExtension')
const { getWorkspaceFolder } = require('../utils/utils')

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
        // 新建 .ui 文件（侧边栏按钮：输入文件名后创建并打开）
        case 'openIDE': {
          const preferredExt = getPreferredExtension()
          const workspaceFolder = getWorkspaceFolder(context)
          const extLabel = preferredExt.replace('.', '').toUpperCase()
          const defaultUri = workspaceFolder
            ? vscode.Uri.joinPath(workspaceFolder, 'project' + preferredExt)
            : undefined
          vscode.window.showSaveDialog({
            title: '新建 MyBricks 设计文件',
            defaultUri,
            filters: {
              [`MyBricks 设计文件 (${extLabel})`]: [preferredExt.replace('.', '')],
              '所有文件': ['*'],
            },
            saveLabel: '新建',
          }).then((saveUri) => {
            if (!saveUri) return
            let filePath = saveUri.fsPath
            const ext = path.extname(filePath)
            if (!ext) {
              filePath = filePath + preferredExt
            } else if (ext !== '.ui' && ext !== '.mybricks') {
              filePath = path.join(path.dirname(filePath), path.basename(filePath, ext) + preferredExt)
            }
            if (!fs.existsSync(filePath)) {
              fs.writeFileSync(filePath, '{}', 'utf-8')
            }
            vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath), { preview: false })
          })
          break
        }
        
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
            // 直接用 vscode.open，VSCode 会自动使用 mybricks.editor CustomEditor
            vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath), { preview: false })
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

