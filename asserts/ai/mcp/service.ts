/**
 * MCP AI 全局 Service：挂载到 window.__mybricksAIService，支持异步 ready
 */
import type { MyBricksAIService } from './types'

let resolveReady: ((value: MyBricksAIService) => void) | null = null
const readyPromise = new Promise<MyBricksAIService>((resolve) => {
  resolveReady = resolve
})

/** 仅内部使用：resolve readyPromise 并清空，避免重复 resolve */
export function resolveReadyAndClear(service: MyBricksAIService) {
  if (resolveReady) {
    resolveReady(service)
    resolveReady = null
  }
}

export function installAIService(): MyBricksAIService {
  if (typeof window === 'undefined') {
    return null as any
  }
  const win = window as any
  if (win.__mybricksAIService) {
    return win.__mybricksAIService as MyBricksAIService
  }
  const service: MyBricksAIService = {
    api: null,
    focus: null,
    isReady: () => !!win.__mybricksAIService?.api,
    ready: () => {
      const s = win.__mybricksAIService as MyBricksAIService
      if (s?.api) return Promise.resolve(s)
      return readyPromise
    },
  }
  win.__mybricksAIService = service
  return service
}

export function getAIService(): MyBricksAIService | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as any).__mybricksAIService as MyBricksAIService | undefined
}

/**
 * 设计器初始化时调用：从插件读取 MCP 开关、设置 window.__mybricksMCPEnabled、安装 AI Service
 * 供 config.tsx 在设计器加载前执行，保证 createAIPlugin 能读到正确的 __mybricksMCPEnabled
 */
export async function initMCPForDesigner(vsCodeMessage: { call: (method: string) => Promise<any> } | null | undefined): Promise<void> {
  if (typeof window === 'undefined') return
  if (!vsCodeMessage?.call) return
  const mcpEnabled = (await vsCodeMessage.call('getMCPEnabled')) === true
  ;(window as any).__mybricksMCPEnabled = mcpEnabled
  installAIService()
}

