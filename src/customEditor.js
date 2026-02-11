const vscode = require('vscode')
const { getInstance: getWebviewManager } = require('./manager/webviewManager')
const { isMybricksFile } = require('./fileExtension')

/**
 * 注册设计文件关联（.ui / .mybricks）
 * 当用户点击 .ui 或 .mybricks 文件时，打开设计器并加载该文件
 * @param {vscode.ExtensionContext} context - 扩展上下文
 */
function registerCustomEditor(context) {
  // 监听文件打开事件：用户点击设计文件时，用设计器打开并关闭文本标签
  const disposable = vscode.workspace.onDidOpenTextDocument(async (document) => {
    if (document.uri.scheme !== 'file' || !isMybricksFile(document.fileName)) {
      return
    }
    const webviewManager = getWebviewManager()
    const filePath = document.uri.fsPath

    console.log(`[MyBricks] 打开设计文件: ${filePath}`)

    webviewManager.setCurrentFilePath(filePath)
    await webviewManager.ensurePanel()

    // 关闭该设计文件对应的文本编辑器标签（避免与设计器重复）
    const uriStr = document.uri.toString()
    const tab = vscode.window.tabGroups.all
      .flatMap((g) => g.tabs)
      .find((t) => t.input?.uri?.toString() === uriStr)
    if (tab) {
      await vscode.window.tabGroups.close(tab, false)
    }
  })
  
  context.subscriptions.push(disposable)
  
  // 注册命令：用于右键菜单"打开方式"
  const openWithCommand = vscode.commands.registerCommand(
    'mybricks.openFile',
    async (uri) => {
      const webviewManager = getWebviewManager()
      const filePath = uri.fsPath
      
      console.log(`[MyBricks] 通过命令打开文件: ${filePath}`)
      
      // 设置当前编辑的文件路径
      webviewManager.setCurrentFilePath(filePath)
      
      // 打开设计器面板
      await webviewManager.ensurePanel()
    }
  )
  
  context.subscriptions.push(openWithCommand)
}

module.exports = {
  registerCustomEditor,
}
