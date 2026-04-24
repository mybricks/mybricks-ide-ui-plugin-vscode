export type OnDownloadParams = {
  name: string
  content: string
}

export type GetAiPluginOptions = {
  key: string
  /** true → Infra 通道可用（由外部 checkInfraAvailable 决定）；false → 仅 mybricks / custom */
  useInfra?: boolean
  /** VSCode 下由 extension 弹窗选择保存路径并写入文件；支持异步 */
  onDownload?: (params: OnDownloadParams) => void | Promise<void>
  /** 三方库 + 主题配置（从 CDN 获取的 codingConfig） */
  codingConfig?: {
    themes?: Array<{ id: string; name: string; vars: Array<{ propertyName: string; value: string; title: string; type: string }> }>
    availableLibraries?: Array<{ name: string; version: string; readme: string; urls: string[]; library: string }>
  }
}

/** 从 globalState 读取 AI 设置（channel、token、custom 配置） */
async function getAISetting(): Promise<Record<string, any>> {
  const vsCodeMessage = (window as any).webViewMessageApi
  return vsCodeMessage?.call('getAISetting').catch(() => null) ?? {}
}

/**
 * 根据已保存的 settings 和 useInfra 决定最终生效的渠道。
 * infra 在 useInfra=false 时不可用，自动降级到 mybricks。
 */
function resolveChannel(settings: Record<string, any>, useInfra: boolean): 'infra' | 'mybricks' | 'custom' {
  const saved = settings?.channel as string | undefined
  if (saved === 'infra') return useInfra ? 'infra' : 'mybricks'
  if (saved === 'custom') return 'custom'
  // 未配置时跟随 useInfra
  return useInfra ? 'infra' : 'mybricks'
}

export default async ({ key, useInfra = true, onDownload, codingConfig }: GetAiPluginOptions) => {
  const PluginAI = (window as any).MyBricksPluginAI || {}
  const {
    default: AIPlugin,
    createMyBricksAIRequestSSE,
    createInfraAIRequest,
    createInfraAIOnUpload,
  } = PluginAI

  if (!AIPlugin) {
    console.warn('[MyBricks] window.MyBricksPluginAI is not loaded. Ensure plugin-ai is loaded via manifest.')
    return null
  }

  // 三种渠道的请求函数在插件初始化时各创建一次，config getter 动态读取 globalState
  const requestMybricks = createMyBricksAIRequestSSE({
    getToken: () => getAISetting().then((s) => s?.mybricksAiToken ?? '').catch(() => ''),
  })
  const requestInfra = useInfra ? createInfraAIRequest() : null
  const infraUpload = useInfra ? createInfraAIOnUpload() : null

  const setting = await getAISetting();
  const channel = resolveChannel(setting, useInfra);

  const customPrams = channel === 'custom' ? {
    llm: {
      providers: setting.providers,
    }
  } : {}

  return AIPlugin({
    key,
    createTemplates: {
      page: ({ title }) => {
        return {
          type: "normal",
          title: "页面",
          inputs: [
            {
              id: "open",
              title: "打开",
              schema: {
                type: "any",
              },
            },
          ],
        }
      }
    },
    onUpload: infraUpload
      ? async (params: any) => {
          const settings = await getAISetting()
          const channel = resolveChannel(settings, useInfra)
          if (channel === 'infra') return infraUpload(params)
        }
      : undefined,
    // channel === 'custom' 不会走到这里
    onRequest: async (params: any) => {
      const settings = await getAISetting()
      const channel = resolveChannel(settings, useInfra)

      if (channel === 'infra' && requestInfra) return requestInfra(params)
      return requestMybricks(params)
    },
    // channel === 'custom'会执行这里
    ...customPrams,
    onDownload,
    codingMode: true,
    codingConfig,
  })
}
