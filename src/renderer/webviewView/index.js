const vscode = require('vscode')
const fs = require('fs')
const path = require('path')
const { getPreferredExtension } = require('../../fileExtension')
const { getWorkspaceRoot } = require('../../../utils/workspaceFiles')
const { handleSidebarMessage } = require('../../event')

/**
 * WebviewView 侧边栏视图管理类
 */
class WebviewView {
  /**
   * 获取侧边栏 HTML 内容
   * @param {vscode.Uri} extensionUri - 扩展 URI
   * @returns {string}
   */
  getWebviewContent(extensionUri) {
    const htmlPath = path.join(__dirname, 'index.html')
    let htmlContent = fs.readFileSync(htmlPath, 'utf8')

    // 将 ./asserts/... 等本地相对路径转成 webview 资源 URI
    // 注意：这里侧边栏通常不需要转换，但保留以保持一致性
    return htmlContent
  }

  /**
   * 获取 finclip 场景下的精简侧边栏内容
   * @returns {string}
   */
  getFinclipWebviewContent() {
    const htmlPath = path.join(__dirname, 'finclip.html')
    return fs.readFileSync(htmlPath, 'utf8')
  }

  createProvider(context) {
    const extensionUri = context.extensionUri
    const self = this

    return {
      resolveWebviewView(webviewView, webviewContext, token) {
        webviewView.webview.options = {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.joinPath(extensionUri, 'asserts'),
            extensionUri,
          ],
        }

        const preferredExt = getPreferredExtension()
        const workspaceRoot = getWorkspaceRoot()
        const finclipProjectPath = path.join(workspaceRoot, '.finclip', `project${preferredExt}`)

        // 设置侧边栏 HTML 内容
        webviewView.webview.html = fs.existsSync(finclipProjectPath)
          ? self.getFinclipWebviewContent()
          : self.getWebviewContent(extensionUri)

        // 处理侧边栏消息
        handleSidebarMessage(webviewView, context)
      },
    }
  }
}

module.exports = WebviewView
