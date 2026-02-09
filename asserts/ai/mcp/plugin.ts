/**
 * 设计器 AI 插件：向设计器注册 aiService.init，用于注入 api 与 focus
 * 是否生效由插件 setting mybricks.mcp.enabled 控制（window.__mybricksMCPEnabled）
 */
import React from 'react'
import type { AiServiceAPI, AiServiceFocusParams, MyBricksAIService } from './types'
import { getAIService, resolveReadyAndClear } from './service'

let lastApi: AiServiceAPI | null = null

/** 当 setting 变为开启时，将已保存的 api 挂到 service（供 mcpSettingChanged 时调用） */
export function applyMCPEnabledToService(enabled: boolean) {
  if (!enabled) return
  const service = getAIService() as MyBricksAIService | undefined
  if (service && lastApi) {
    service.api = lastApi
    service.focus = null
    resolveReadyAndClear(service)
  }
}

export function createAIPlugin() {
  return {
    name: '@mybricks/plugins/ai',
    title: '智能助手',
    author: 'MyBricks',
    version: '1.0.0',
    description: 'ai for MyBricks',
    contributes: {
      aiService: {
        init(api: AiServiceAPI) {
          lastApi = api
          const enabled = (typeof window !== 'undefined' && (window as any).__mybricksMCPEnabled) === true
          const service = getAIService() as MyBricksAIService | undefined
          if (service && enabled) {
            service.api = api
            service.focus = null
            resolveReadyAndClear(service)
          }
          console.log('[AI Plugin - init] API initialized', enabled ? 'MCP enabled' : 'MCP disabled')

          return {
            focus(params: AiServiceFocusParams | null | undefined) {
              const currentFocus = params ?? undefined
              const s = getAIService() as MyBricksAIService | undefined
              if (s) s.focus = currentFocus
              console.log('[AI Plugin - focus]', currentFocus)
            },
            request() {},
            registerAgent() {},
            fileFormat() {},
          }
        },
      },
      aiView: {
        render() {
          return React.createElement('div', { style: { padding: '20px' } }, 'AI View Placeholder')
        },
        display() {},
        hide() {},
      },
      aiStartView: {
        render() {
          return React.createElement('div', { style: { padding: '20px' } }, 'AI Start View Placeholder')
        },
      },
    },
  }
}
