/**
 * MCP 相关状态与副作用的统一 Hook
 * - 初读/监听「是否开启 MCP」setting
 * - 监听「开启 MCP 服务」成功通知
 * - 在 initSuccess 且 mcpEnabled 时注册 callGlobalApi、getFocusElementInfo 等 handler
 */
import { useState, useEffect, useRef } from 'react'
import { message } from 'antd'
import { getAIService } from './service'
import { applyMCPEnabledToService } from './plugin'
import { registerMCPHandlers } from './handlers'

declare global {
  interface Window {
    __mybricksMCPEnabled?: boolean
  }
}

export interface UseMCPOptions {
  /** 设计器是否已初始化完成（config 已加载） */
  initSuccess?: boolean
  /** 返回 MyBricksAPI 的 ref，用于 registerMCPHandlers */
  myBricksAPIRefGetter?: () => React.MutableRefObject<any>
  /** 可选：覆盖默认的 message.success（如「MCP 服务已开启」） */
  onMCPEnabled?: (data?: { port?: number }) => void
}

/**
 * 统一管理 MCP 启用状态、setting 监听、handler 注册
 * @param vsCodeMessage - webViewMessageApi（如 (window as any).webViewMessageApi）
 * @param options - initSuccess、myBricksAPIRefGetter、onMCPEnabled
 * @returns { mcpEnabled, getAIService }
 */
export function useMCP(
  vsCodeMessage: {
    call: (method: string, ...args: any[]) => Promise<any>
    on: (event: string, cb: (data: any) => void) => (() => void) | undefined
    registerHandler?: (name: string, handler: (...args: any[]) => any) => void
  } | null | undefined,
  options: UseMCPOptions = {}
) {
  const { initSuccess = false, myBricksAPIRefGetter, onMCPEnabled } = options
  const [mcpEnabled, setMcpEnabled] = useState(false)
  /** MCP 服务已启动（收到 mcpEnabled 事件），用于在设计器内提示「已开启但未就绪」 */
  const [mcpServerReady, setMcpServerReady] = useState(false)
  const onMCPEnabledRef = useRef(onMCPEnabled)
  onMCPEnabledRef.current = onMCPEnabled

  // 初读「是否开启 MCP」setting（不阻塞设计器加载，由 useMCP 按需读取）
  useEffect(() => {
    if (!vsCodeMessage?.call) return
    vsCodeMessage.call('getMCPEnabled').then((v: boolean) => {
      const en = v === true
      setMcpEnabled(en)
      if (typeof window !== 'undefined') window.__mybricksMCPEnabled = en
    })
  }, [vsCodeMessage])

  // 监听 setting 变化（设置页或命令「开启 MCP 服务」会触发）
  useEffect(() => {
    if (!vsCodeMessage?.on) return
    const unsub = vsCodeMessage.on('mcpSettingChanged', (data: { enabled?: boolean }) => {
      const en = data?.enabled === true
      setMcpEnabled(en)
      if (!en) setMcpServerReady(false)
      if (typeof window !== 'undefined') window.__mybricksMCPEnabled = en
      if (en) applyMCPEnabledToService(true)
    })
    return () => unsub?.()
  }, [vsCodeMessage])

  // 监听「开启 MCP 服务」成功通知：标记服务已就绪并提示
  useEffect(() => {
    if (!vsCodeMessage?.on) return
    const unsub = vsCodeMessage.on('mcpEnabled', (data: { port?: number }) => {
      setMcpServerReady(true)
      if (onMCPEnabledRef.current) {
        onMCPEnabledRef.current(data)
      } else {
        message.success(
          data?.port != null ? `MCP 服务已开启 (端口 ${data.port})` : 'MCP 服务已开启'
        )
      }
    })
    return () => unsub?.()
  }, [vsCodeMessage])

  // 注册 MCP 用到的 callGlobalApi、getFocusElementInfo 等 handler（仅 MCP 启用且设计器就绪时）
  useEffect(() => {
    if (!initSuccess || !mcpEnabled || !vsCodeMessage || !myBricksAPIRefGetter) return
    registerMCPHandlers(vsCodeMessage, myBricksAPIRefGetter)
  }, [initSuccess, mcpEnabled, vsCodeMessage, myBricksAPIRefGetter])

  return { mcpEnabled, mcpServerReady, getAIService }
}
