const vscode = require('vscode')
const fs = require('fs')
const path = require('path')
const { getWorkspaceFolder } = require('./utils')

/**
 * 导出 MyBricks 项目
 * @param {vscode.ExtensionContext} context - 扩展上下文
 * @param {Object} configJson - 配置数据
 * @returns {Promise<Object>} 导出结果
 */
async function exportProject(context, configJson) {
  try {
    const workspaceFolder = getWorkspaceFolder(context)
    const rootPath = workspaceFolder.fsPath
    
    // 让用户选择导出路径
    const defaultUri = vscode.Uri.file(path.join(rootPath, 'mybricks-export'))
    const uri = await vscode.window.showSaveDialog({
      defaultUri,
      filters: {
        'JSON Files': ['json'],
        'All Files': ['*']
      },
      title: '导出 MyBricks 项目'
    })

    if (!uri) {
      // 用户取消了
      return { success: false, message: '用户取消导出' }
    }

    const exportPath = uri.fsPath
    
    // 确保目录存在
    const dir = path.dirname(exportPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // 导出数据
    const exportData = {
      ...configJson,
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    }

    // 保存导出文件
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf-8')
    
    vscode.window.showInformationMessage(`项目已导出: ${path.basename(exportPath)}`)
    
    // 询问是否打开导出文件
    const action = await vscode.window.showInformationMessage(
      '导出成功！是否在编辑器中打开？',
      '打开',
      '取消'
    )

    if (action === '打开') {
      const document = await vscode.workspace.openTextDocument(exportPath)
      await vscode.window.showTextDocument(document)
    }

    return {
      success: true,
      path: exportPath,
      message: '导出成功'
    }
  } catch (error) {
    vscode.window.showErrorMessage(`导出项目失败: ${error.message}`)
    console.error('Error exporting project:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

module.exports = {
  exportProject,
}
