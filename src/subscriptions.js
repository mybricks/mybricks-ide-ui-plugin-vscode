const vscode = require('vscode')
const path = require('path')
const { WebviewView } = require('./renderer')
const { PROTECTED_DIRS } = require('../utils/constants')
const { runInit } = require('./init')
const {
  getServerUrl,
  getServerPort,
  startMCPHttpServer,
  isMCPServerRunning,
  setupMCPWorkspace,
} = require('./mcp-server')
const { getInstance: getWebviewManager } = require('./manager/webviewManager')
const { registerCustomEditor } = require('./customEditor')

// WebviewView 侧边栏视图实例
const webviewView = new WebviewView()

/**
 * 注册所有订阅（命令、视图等）
 * @param {vscode.ExtensionContext} context - 扩展上下文
 */
function registerSubscriptions(context) {
  // 获取 WebviewManager 单例并初始化
  const webviewManager = getWebviewManager()
  webviewManager.initialize(context)

  // 注册命令：右键菜单"用 MyBricks 打开"（CustomEditor 模式：直接用 vscode.open）
  const openFileCommand = vscode.commands.registerCommand(
    'mybricks.openFile',
    async (uri) => {
      if (uri) {
        await vscode.commands.executeCommand('vscode.open', uri, { preview: false })
      }
    }
  )

  // 注册命令：右键文件夹"新建 .ui 文件"
  const newUIFileCommand = vscode.commands.registerCommand(
    'mybricks.newUIFile',
    async (uri) => {
      const folderUri = uri?.fsPath ? uri : vscode.workspace.workspaceFolders?.[0]?.uri
      if (!folderUri) {
        vscode.window.showErrorMessage('无法确定目标文件夹')
        return
      }

      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath
      if (workspaceRoot) {
        const folderPath = folderUri.fsPath
        if (!folderPath.startsWith(workspaceRoot)) {
          vscode.window.showErrorMessage('目标文件夹超出工作区范围')
          return
        }
        const relativeParts = path.relative(workspaceRoot, folderPath).split(path.sep)
        if (relativeParts.some((seg) => PROTECTED_DIRS.includes(seg))) {
          vscode.window.showErrorMessage('不允许在 node_modules、.git 等受保护目录中创建文件')
          return
        }
      }

      const input = await vscode.window.showInputBox({
        prompt: '请输入文件名（无需填写后缀）',
        placeHolder: 'untitled',
        validateInput: (value) => {
          if (!value || !value.trim()) return '文件名不能为空'
          if (/[/\\:*?"<>|]/.test(value)) return '文件名包含非法字符'
          return null
        },
      })

      if (input === undefined) return

      const fileName = input.trim().replace(/\.ui$/, '') + '.ui'
      const newFileUri = vscode.Uri.joinPath(folderUri, fileName)

      try {
        await vscode.workspace.fs.stat(newFileUri)
        vscode.window.showErrorMessage(`文件 ${fileName} 已存在`)
        return
      } catch {
        // 文件不存在，继续创建
      }

      await vscode.workspace.fs.writeFile(newFileUri, new Uint8Array())
      await vscode.commands.executeCommand('vscode.open', newFileUri, { preview: false })
    }
  )

  // 注册命令：初始化 MyBricks 环境
  const initCommand = vscode.commands.registerCommand(
    'mybricks.init',
    async () => {
      runInit(context)
    }
  )

  // 注册命令：开启 MCP 服务
  const enableMCPCommand = vscode.commands.registerCommand(
    'mybricks.enableMCPService',
    async () => {
      // 1. 若 MCP 服务未启动则先启动
      if (!isMCPServerRunning()) {
        await startMCPHttpServer(context)
      }
      const serverUrl = getServerUrl()

      // 2. 打开 MCP 配置时按需执行：复制 skill 到工作区、写入 mcp.json
      await setupMCPWorkspace(context, serverUrl)

      // 3. 将「是否开启 MCP」配置设为 true
      await vscode.workspace.getConfiguration('mybricks').update('mcp.enabled', true, vscode.ConfigurationTarget.Global)

      // 4. 通知所有已打开面板 setting 已更新
      webviewManager.notifyAllPanels('mcpSettingChanged', { enabled: true })
      webviewManager.notifyAllPanels('mcpEnabled', { port: getServerPort() })

      vscode.window.showInformationMessage('MCP 服务已开启。')
    }
  )

  // 监听配置变化，通知所有已打开的设计器面板（MCP 开关、AI Token）
  const configChangeDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('mybricks.mcp.enabled')) {
      const enabled = vscode.workspace.getConfiguration('mybricks').get('mcp.enabled') === true
      webviewManager.notifyAllPanels('mcpSettingChanged', { enabled })
    }
    if (e.affectsConfiguration('mybricks.ai.token')) {
      webviewManager.notifyAllPanels('aiTokenChanged', {})
    }
  })

  // 注册侧边栏视图提供者
  const provider = webviewView.createProvider(context)
  const webviewViewProvider = vscode.window.registerWebviewViewProvider(
    'mybricks.ide',
    provider
  )

  // 注册自定义编辑器（用于打开 .ui / .mybricks 设计文件）
  registerCustomEditor(context)

  // 将所有订阅添加到 context.subscriptions
  context.subscriptions.push(openFileCommand)
  context.subscriptions.push(newUIFileCommand)
  context.subscriptions.push(initCommand)
  context.subscriptions.push(enableMCPCommand)
  context.subscriptions.push(configChangeDisposable)
  context.subscriptions.push(webviewViewProvider)
}

module.exports = {
  registerSubscriptions,
}
