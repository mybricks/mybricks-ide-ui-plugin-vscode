/**
 * MCP AI 可插拔模块
 * - 是否启用由插件 setting mybricks.mcp.enabled 控制，前端通过 getMCPEnabled / mcpSettingChanged 读取和监听
 * - installAIService() 初始化全局 __mybricksAIService
 * - createAIPlugin() 用于设计器 config plugins
 * - applyMCPEnabledToService() 在 setting 变为开启时挂载 api（mcpSettingChanged 时调用）
 * - registerMCPHandlers() 用于 App 注册 callGlobalApi / getFocusElementInfo
 */

export { installAIService, getAIService, initMCPForDesigner } from './service'
export { createAIPlugin, applyMCPEnabledToService } from './plugin'
export { registerMCPHandlers } from './handlers'
export { useMCP } from './useMCP'
export type { UseMCPOptions } from './useMCP'
export type { AiServiceAPI, AiServiceFocusParams, MyBricksAIService } from './types'
