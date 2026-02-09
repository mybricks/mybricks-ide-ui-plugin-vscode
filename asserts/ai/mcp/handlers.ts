/**
 * MCP 消息 Handler：callGlobalApi、getFocusElementInfo 等，供 VSCode 扩展/MCP 调用
 */

import { getAIService } from './service'

type MyBricksAPIRef = { current: any }

/**
 * 注册 MCP 相关 handler 到 webViewMessageApi
 * @param vsCodeMessage - webViewMessageApi 实例（如 (window as any).webViewMessageApi）
 * @param getMyBricksAPIRef - 返回 MyBricksAPI 实例的 ref：() => { current }
 */
export function registerMCPHandlers(
  vsCodeMessage: {
    registerHandler: (name: string, handler: (...args: any[]) => any) => void
  } | null | undefined,
  getMyBricksAPIRef: () => MyBricksAPIRef
) {
  if (!vsCodeMessage) {
    console.error('[MCP AI] vsCodeMessage is not available')
    return
  }

  const createGlobalApiProxy = async (methodName: string, ...args: any[]) => {
    const aiService = getAIService()
    if (!aiService) throw new Error('AI Service 未初始化')

    const service = await aiService.ready()
    if (!service.api) throw new Error('AI Service API 不可用')

    const MyBricksAPI = (window as any).MyBricksAPI
    if (!MyBricksAPI) throw new Error('MyBricksAPI 未加载')

    const ref = getMyBricksAPIRef()
    if (!ref.current) {
      ref.current = new MyBricksAPI.MyBricksAPI({ api: service.api })
    }

    const pathSegments = methodName.split('.')
    let current: any = ref.current
    for (const segment of pathSegments) {
      if (current == null) throw new Error(`路径 ${methodName} 不存在`)
      current = current[segment]
    }
    if (typeof current !== 'function') throw new Error(`${methodName} 不是一个函数`)
    return current(...args)
  }

  vsCodeMessage.registerHandler('callGlobalApi', async (data: { methodName: string; args?: any[] }) => {
    const { methodName, args } = data ?? {}
    if (!methodName) throw new Error('methodName 必须提供')
    try {
      return await createGlobalApiProxy(methodName, ...(args || []))
    } catch (error) {
      console.error('[MCP AI] callGlobalApi handler error:', error)
      throw error
    }
  })

  vsCodeMessage.registerHandler('getFocusElementInfo', async () => {
    const aiService = getAIService()
    return aiService?.focus ?? null
  })

  console.log('[MCP AI] Handlers registered: callGlobalApi, getFocusElementInfo')
}
