const vscode = require('vscode')
const fs = require('fs')
const path = require('path')

/**
 * 获取 MyBricks 项目文件内容
 * @param {vscode.ExtensionContext} context - 扩展上下文
 * @returns {Object|null} 项目内容
 */
function getFileContent(context) {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('未打开工作区')
      return null
    }

    const rootPath = workspaceFolders[0].uri.fsPath
    
    // 查找 MyBricks 项目文件，优先级顺序
    const possibleFiles = [
      'mybricks.json',
      '.mybricks/project.json',
      'src/mybricks.json'
    ]

    for (const file of possibleFiles) {
      const filePath = path.join(rootPath, file)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(content)
      }
    }

    // 如果没有找到，返回空项目结构
    vscode.window.showInformationMessage('未找到 MyBricks 项目文件，创建新项目')
    return {
      pages: [],
      components: [],
      config: {}
    }
  } catch (error) {
    vscode.window.showErrorMessage(`读取项目失败: ${error.message}`)
    console.error('Error reading project:', error)
    return null
  }
}

/**
 * 保存 MyBricks 项目文件内容
 * @param {vscode.ExtensionContext} context - 扩展上下文
 * @param {Object} data - 项目数据
 */
function saveFileContent(context, data) {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('未打开工作区')
      return
    }

    const rootPath = workspaceFolders[0].uri.fsPath
    
    // 默认保存路径
    let savePath = path.join(rootPath, 'mybricks.json')
    
    // 如果已存在项目文件，则更新现有文件
    const possibleFiles = [
      'mybricks.json',
      '.mybricks/project.json',
      'src/mybricks.json'
    ]

    for (const file of possibleFiles) {
      const filePath = path.join(rootPath, file)
      if (fs.existsSync(filePath)) {
        savePath = filePath
        break
      }
    }

    // 确保目录存在
    const dir = path.dirname(savePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // 保存文件
    fs.writeFileSync(savePath, JSON.stringify(data, null, 2), 'utf-8')
    
    vscode.window.showInformationMessage(`项目已保存: ${path.basename(savePath)}`)
  } catch (error) {
    vscode.window.showErrorMessage(`保存项目失败: ${error.message}`)
    console.error('Error saving project:', error)
  }
}

module.exports = {
  getFileContent,
  saveFileContent,
}
