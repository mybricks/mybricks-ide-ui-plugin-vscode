const vscode = require('vscode')
const https = require('https')
const { registerSubscriptions } = require('./subscriptions')
const { stopMCPHttpServer } = require('./mcp-server')
const { registerUriHandler } = require('./uriHandler')

const PUBLISHER = 'mybricks'
const EXTENSION_NAME = 'mybricks-webview'

/**
 * 从 VS Code Marketplace 查询插件的最新版本号
 * @returns {Promise<string|null>}
 */
function fetchLatestVersion() {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      filters: [{
        criteria: [{ filterType: 7, value: `${PUBLISHER}.${EXTENSION_NAME}` }]
      }],
      flags: 0x200
    })

    const options = {
      hostname: 'marketplace.visualstudio.com',
      path: '/_apis/public/gallery/extensionquery',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json;api-version=3.0-preview.1',
        'Content-Length': Buffer.byteLength(body)
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const versions = json?.results?.[0]?.extensions?.[0]?.versions
          const latest = versions?.[0]?.version ?? null
          // 校验版本号格式合法（形如 1.2.3）
          const isValid = latest && /^\d+\.\d+\.\d+$/.test(latest)
          resolve(isValid ? latest : null)
        } catch {
          resolve(null)
        }
      })
    })

    req.on('error', () => resolve(null))
    req.setTimeout(5000, () => { req.destroy(); resolve(null) })
    req.write(body)
    req.end()
  })
}

/**
 * 比较两个 semver 版本号，返回 true 表示 v2 > v1
 * @param {string} v1
 * @param {string} v2
 */
function isNewerVersion(v1, v2) {
  const parse = (v) => v.split('.').map(Number)
  const [a1, b1, c1] = parse(v1)
  const [a2, b2, c2] = parse(v2)
  if (a2 !== a1) return a2 > a1
  if (b2 !== b1) return b2 > b1
  return c2 > c1
}

/**
 * 检查 Marketplace 是否有更新版本，有则弹窗提醒
 * @param {vscode.ExtensionContext} context
 */
async function checkUpdateNotification(context) {
  try {
  const currentVersion = context.extension.packageJSON.version
  // 当前版本格式不合法则跳过
  if (!/^\d+\.\d+\.\d+$/.test(currentVersion)) return

  const latestVersion = await fetchLatestVersion()
  // 未能取到合法版本号，静默退出
  if (!latestVersion) return

  if (isNewerVersion(currentVersion, latestVersion)) {
    vscode.window.showInformationMessage(
      `VibeUI 有新版本 v${latestVersion} 可用（当前 v${currentVersion}），可在扩展面板中进行更新。`
    )
  }
  } catch {
    // 任何意外错误都静默处理，不影响插件正常使用
  }
}

/**
 * 插件激活时的生命周期钩子
 * @param {vscode.ExtensionContext} context - 扩展上下文
 */
function onActivate(context) {
  // 异步检查 Marketplace 是否有新版本，有则弹窗提醒
  checkUpdateNotification(context)

  // 注册所有订阅（命令、视图等）
  registerSubscriptions(context)

  // 注册 URI Handler：浏览器可通过 vscode://mybricks.mybricks-webview/open 唤起 Cursor 并打开设计器
  context.subscriptions.push(registerUriHandler(context))

  // MCP 服务不在此处启动，需打开设计器后通过命令「开启 MCP 服务」触发
  // 不再默认打开 MyBricks 设计器，用户通过命令或打开 .ui / .mybricks 文件进入

  // 调试前端时自动打开开发者工具（需先手动打开设计器）
  if (process.env.MYBRICKS_FRONT_END_DEBUG_MODE === 'true') {
    setTimeout(() => {
      vscode.commands.executeCommand('workbench.action.webview.openDeveloperTools')
    }, 1000)
  }
}

/**
 * 插件停用时的生命周期钩子
 */
function onDeactivate() {
  // 停止 MCP HTTP 服务器
  stopMCPHttpServer()

  // 清理资源
  // 可以在这里添加清理逻辑，如关闭面板、释放资源等
}

module.exports = {
  onActivate,
  onDeactivate,
}

