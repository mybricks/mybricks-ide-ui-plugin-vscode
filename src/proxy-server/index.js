const http = require('http')
const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')

const PROXY_PORT = 19001

let serverInstance = null

/**
 * 启动代理服务
 * @param {Record<string, {target: string, headers?: object, changeOrigin?: boolean}>} proxy
 * @returns {Promise<number>} 返回监听的端口号
 */
async function startProxyServer(proxy = {}) {
  if (serverInstance) {
    return PROXY_PORT
  }

  const app = express()

  for (const [pathPattern, rule] of Object.entries(proxy)) {
    const { target, headers = {}, changeOrigin = true } = rule

    if (!pathPattern || !target) continue

    app.use(
      createProxyMiddleware({
        pathFilter: pathPattern,
        target,
        changeOrigin,
        headers,
        logger: console,
      })
    )
  }

  return new Promise((resolve, reject) => {
    const server = http.createServer(app)
    server.listen(PROXY_PORT, '127.0.0.1', () => {
      serverInstance = server
      console.log(`[ProxyServer] 代理服务已启动，端口: ${PROXY_PORT}`)
      resolve(PROXY_PORT)
    })
    server.on('error', (err) => {
      console.error('[ProxyServer] 启动失败:', err.message)
      reject(err)
    })
  })
}

/**
 * 停止代理服务
 * @returns {Promise<void>}
 */
async function stopProxyServer() {
  if (!serverInstance) return
  return new Promise((resolve) => {
    serverInstance.close(() => {
      serverInstance = null
      console.log('[ProxyServer] 代理服务已停止')
      resolve()
    })
  })
}

/**
 * 获取当前代理服务端口（未启动时返回 null）
 * @returns {number|null}
 */
function getPort() {
  return serverInstance ? PROXY_PORT : null
}

module.exports = { startProxyServer, stopProxyServer, getPort }
