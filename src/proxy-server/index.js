const http = require('http')
const https = require('https')
const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')

// Map<filePath | '__default__', { server: http.Server, port: number }>
const serverMap = new Map()

/**
 * 启动代理服务（按 filePath 隔离，配置变更时重启该实例）
 * @param {Record<string, {target: string, headers?: object, changeOrigin?: boolean}>} proxy
 * @param {string|null} filePath - webview 对应的文件路径，null 时使用 '__default__' key
 * @returns {Promise<number>} 返回监听的端口号
 */
async function startProxyServer(proxy = {}, filePath = null) {
  const key = filePath ?? '__default__'

  const existing = serverMap.get(key)
  if (existing) {
    await new Promise((resolve) => {
      existing.server.close(() => {
        serverMap.delete(key)
        resolve()
      })
    })
  }

  const app = express()

  // 通用绝对 URL 代理端点：/__absolute_proxy__?url=https://...
  // 用于前端直接传入完整域名+路径的请求，代理服务器负责转发并处理 CORS
  app.use('/__absolute_proxy__', (req, res) => {
    const targetUrl = req.query.url
    if (!targetUrl || !/^https?:\/\//.test(targetUrl)) {
      res.status(400).json({ error: '缺少有效的 url 查询参数' })
      return
    }

    const parsedUrl = new URL(targetUrl)
    const isHttps = parsedUrl.protocol === 'https:'
    const lib = isHttps ? https : http

    // 透传原始请求头，移除 host 避免目标服务器拒绝
    const forwardHeaders = Object.assign({}, req.headers)
    delete forwardHeaders['host']
    delete forwardHeaders['connection']

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: req.method,
      headers: forwardHeaders,
    }

    const proxyReq = lib.request(options, (proxyRes) => {
      res.status(proxyRes.statusCode)
      // 透传响应头，添加 CORS 头
      Object.entries(proxyRes.headers).forEach(([k, v]) => {
        if (k.toLowerCase() !== 'transfer-encoding') res.setHeader(k, v)
      })
      res.setHeader('Access-Control-Allow-Origin', '*')
      proxyRes.pipe(res)
    })

    proxyReq.on('error', (err) => {
      console.error('[ProxyServer] /__absolute_proxy__ 转发失败:', err.message)
      if (!res.headersSent) res.status(502).json({ error: err.message })
    })

    req.pipe(proxyReq)
  })

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
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port
      serverMap.set(key, { server, port })
      console.log(`[ProxyServer] 代理服务已启动，key: ${key}，端口: ${port}`)
      resolve(port)
    })
    server.on('error', (err) => {
      console.error('[ProxyServer] 启动失败:', err.message)
      reject(err)
    })
  })
}

/**
 * 停止指定 filePath 对应的代理服务
 * @param {string|null} filePath
 * @returns {Promise<void>}
 */
async function stopProxyServer(filePath = null) {
  const key = filePath ?? '__default__'
  const existing = serverMap.get(key)
  if (!existing) return
  return new Promise((resolve) => {
    existing.server.close(() => {
      serverMap.delete(key)
      console.log(`[ProxyServer] 代理服务已停止，key: ${key}`)
      resolve()
    })
  })
}

/**
 * 获取指定 filePath 对应的代理服务端口（未启动时返回 null）
 * @param {string|null} filePath
 * @returns {number|null}
 */
function getPort(filePath = null) {
  const key = filePath ?? '__default__'
  return serverMap.get(key)?.port ?? null
}

module.exports = { startProxyServer, stopProxyServer, getPort }
