/**
 * MyBricks 资源 manifest 加载器
 *
 * manifest.json 结构：
 * {
 *   designer: { name: string, url: string },   // designer-spa UMD
 *   aiComLib: { name: string, url: string },    // AI 组件库 edit.js
 * }
 *
 * 版本号策略：
 *   - 固定使用 latest（CDN 维护 latest 软链指向当前稳定版）
 *   - manifest URL 追加 ?t=<timestamp> 防 WebView 缓存
 *   - CDN 加载失败时自动降级到 FALLBACK_MANIFEST 中的兜底 URL
 *
 * 使用方式：
 *   import { loadManifest } from './manifest'
 *   const manifest = await loadManifest()
 */

export interface ManifestEntry {
  name: string
  url?: string
  version?: string
}

export interface Manifest {
  designer: ManifestEntry
  aiComLib: ManifestEntry
  version?: string
}

/** 远端 manifest CDN 地址（latest 软链，CDN 侧维护） */
const MANIFEST_CDN_URL = 'https://p4-ec.ecukwai.com/kos/nlav11092/vibe-coding/latest/manifest.json'

/**
 * 兜底 manifest：CDN 不可达时使用，直接引用同目录的 manifest.json。
 */
import FALLBACK_MANIFEST from './manifest.json'

/** 缓存：同一 WebView 生命周期内只 fetch 一次 */
let cachedManifest: Promise<Manifest> | null = null

/**
 * 加载并缓存 manifest
 *
 * 优先从 CDN 拉取最新版本；CDN 不可达时自动降级到 FALLBACK_MANIFEST。
 */
export function loadManifest(): Promise<Manifest> {
  if (cachedManifest) return cachedManifest

  // ?t= 防止 WebView / CDN 返回缓存旧内容
  const url = `${MANIFEST_CDN_URL}?t=${Date.now()}`

  cachedManifest = fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`[manifest] HTTP ${res.status}: ${res.url}`)
      }
      return res.json() as Promise<Manifest>
    })
    .catch((err) => {
      console.warn('[manifest] CDN 加载失败，降级到兜底版本:', err)
      // 清除缓存，下次刷新可重新尝试 CDN
      cachedManifest = null
      return FALLBACK_MANIFEST
    })

  return cachedManifest
}

/**
 * 重置 manifest 缓存（测试 / 热重载场景使用）
 */
export function resetManifestCache(): void {
  cachedManifest = null
}
