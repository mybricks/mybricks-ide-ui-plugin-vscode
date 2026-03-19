/**
 * MyBricks 主应用组件
 */
import React, { useState, useRef, useCallback, useEffect, useMemo, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import {
  ConfigProvider,
  message,
  Space,
  Radio,
  Popover,
  Form,
  Input,
  Button,
  Alert,
  Flex,
  Tooltip,
} from 'antd'
import { VerticalAlignBottomOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons'
import ExportCode from './components/export-code'
import { config as getDesignerConfig } from './config'
import { useMCP } from './ai/mcp'
import { loadManifest } from './manifestLoader'
// 注入 window.exportCodeToVSCode，供 comlib 等使用；React 内可直接 import { exportCodeToVSCode }
import './code-export-vscode-adapter'

// SPADesigner 不再从 window.mybricks 直接取，改为 manifest 动态加载后通过 state 存储

const ANTD_CONFIG = {
  theme: {
    token: {
      colorPrimary: 'var(--mybricks-color-primary)',
    },
  },
}

const vsCodeMessage = (window as any).webViewMessageApi

/** toolbar portal 共享的上下文结构，后续可按需扩展字段 */
interface ToolbarContextValue {
  /** 最后一次保存的时间，null 表示尚未保存（新文件） */
  lastSavedAt: Date | null
}

const ToolbarContext = createContext<ToolbarContextValue>({ lastSavedAt: null })

/** 展示最后保存时间，通过 ToolbarContext 感知更新（绕过 SPADesigner 对 toolbar 的缓存） */
function SaveTimeDisplay() {
  const { lastSavedAt: d } = useContext(ToolbarContext)
  if (!d) return <span style={{ fontSize: 11, color: '#888', userSelect: 'none', letterSpacing: '0.01em' }}>尚未保存</span>
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const text = `保存于 ${isToday ? '' : `${d.getMonth() + 1}/${d.getDate()} `}${hh}:${mm}`
  return <span style={{ fontSize: 11, color: '#888', userSelect: 'none', letterSpacing: '0.01em' }}>{text}</span>
}

/**
 * 动态插入 <script> 标签，加载完成后 resolve
 */
function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`[loadScript] 加载失败: ${url}`))
    document.head.appendChild(script)
  })
}

/**
 * 主应用组件
 */
export default function App() {
  // 内容变更计数
  const [changed, setChanged] = useState(0)

  // 最后一次保存的时间
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const [exportPopoverVisible, setExportPopoverVisible] = useState(false)

  // 消息提示处理
  const onMessage = useCallback((type, msg, duration = 3) => {
    message.destroy()
    message[type](msg, duration)
  }, [])

  // 设计器实例引用
  const designerRef = useRef<any>(null)

  // MyBricksAPI 实例缓存
  const myBricksAPIRef = useRef(null)

  // save 函数的 ref（供防抖回调使用，避免闭包捕获旧值）
  const saveRef = useRef<(() => void) | null>(null)

  // 动态加载的 SPADesigner 组件（manifest 加载完才有值）
  const [SPADesigner, setSPADesigner] = useState<any>(null)

  // 初始化配置（依赖 manifest 加载完成后再执行）
  const [initSuccess, setInitSuccess] = useState(false)
  // 主版本（manifest 顶层 version）
  const [appVersion, setAppVersion] = useState<string | null>(null)
  // 设计器版本（manifest.designer.version）
  const [designerVersion, setDesignerVersion] = useState<string | null>(null)
  // AI 插件版本（manifest.pluginAI.version）
  const [pluginAIVersion, setPluginAIVersion] = useState<string | null>(null)
  const config = useRef<any>(null)

  // 当前打开的文件名
  const [currentFileName, setCurrentFileName] = useState<string>('')

  // 从文件路径中提取文件名（不含后缀）
  const extractFileName = useCallback((filePath: string) => {
    const name = filePath.split(/[/\\]/).pop() ?? filePath
    const dotIndex = name.lastIndexOf('.')
    return dotIndex > 0 ? name.slice(0, dotIndex) : name
  }, [])

  // 是否已配置 AI Token（用于展示横幅），监听 aiTokenChanged 更新
  const [hasAIToken, setHasAIToken] = useState(true)
  const [aiTokenBannerClosed, setAITokenBannerClosed] = useState(false)

  // AI 服务渠道：'infra' = 默认 Infra 通道；'mybricks' = MyBricks 通道（需要用户 token）
  const [aiChannel, setAIChannel] = useState<'infra' | 'mybricks' | null>(null)
  // Infra 是否可用（用于判断是否允许手动切换渠道）
  const [infraAvailable, setInfraAvailable] = useState(false)

  // 0. 启动时立即获取当前文件名和文件修改时间（不等 SPADesigner 加载）
  useEffect(() => {
    if (!vsCodeMessage?.call) return
    vsCodeMessage.call('getFileContent').then((fileResult: any) => {
      const filePath: string = fileResult?.path ?? ''
      if (filePath) {
        setCurrentFileName(extractFileName(filePath))
      }
      // 有文件路径时用文件的 mtime 初始化保存时间，新文件保持 null（显示"尚未保存"）
      if (fileResult?.mtime) {
        setLastSavedAt(new Date(fileResult.mtime))
      }
    }).catch(() => {})
  }, [])

  // 1. 启动时 fetch manifest → 动态加载 designer-spa 和 plugin-ai
  useEffect(() => {
    loadManifest()
      .then((manifest) => {
        console.log('manifest', manifest)
        // 主版本（顶层 version）
        if (manifest?.version) {
          setAppVersion(manifest.version)
        }
        // 设计器版本
        const dVer = manifest?.designer?.version
        if (dVer) {
          setDesignerVersion(dVer)
        }

        // AI 插件版本
        const pAIVer = manifest?.pluginAI?.version
        if (pAIVer) {
          setPluginAIVersion(pAIVer)
        }

        let designerUrl = manifest?.designer?.url
        if (!designerUrl && dVer) {
          designerUrl = `https://f2.eckwai.com/kos/nlav12333/mybricks/designer-spa/${dVer}/index.min.js`
        }

        if (!designerUrl) {
          throw new Error('[manifest] designer.url 和 version 均为空')
        }

        // plugin-ai URL: 优先 manifest.pluginAI.url，兜底用 version 拼接
        const pAI = manifest?.pluginAI
        let pluginAIUrl = pAI?.url
        const pVer = pAI?.version
        if (!pluginAIUrl && pVer) {
          pluginAIUrl = `https://p4-ec.ecukwai.com/kos/nlav11092/vibe-coding/plugin-ai/${pVer}/index.umd.js`
        }

        const scripts: Promise<void>[] = [loadScript(designerUrl)]
        if (pluginAIUrl) {
          scripts.push(loadScript(pluginAIUrl))
        } else {
          console.warn('[manifest] pluginAI.url 和 version 均为空，跳过 plugin-ai 加载')
        }

        return Promise.all(scripts)
      })
      .then(async () => {
        const designer = (window as any).mybricks?.SPADesigner
        if (!designer) {
          throw new Error('[manifest] 加载后 window.mybricks.SPADesigner 不存在')
        }

        // 检测 Infra 服务是否可用，决定 AI 请求渠道
        const { checkInfraAvailable } = (window as any).MyBricksPluginAI || {}
        let infraOk = false
        if (typeof checkInfraAvailable === 'function') {
          infraOk = await checkInfraAvailable().catch(() => false)
        }
        setInfraAvailable(infraOk)

        // 读取用户手动选择的渠道覆盖（存储在 globalState）
        const channelOverride = await vsCodeMessage?.call?.('getAIChannelOverride').catch(() => null) ?? null

        // 最终渠道：优先使用覆盖值，否则跟随 infra 检测结果
        const effectiveChannel: 'infra' | 'mybricks' = channelOverride === 'mybricks' ? 'mybricks' : (infraOk ? 'infra' : 'mybricks')
        setAIChannel(effectiveChannel)

        if (effectiveChannel !== 'infra') {
          // Infra 不可用，检查用户是否配置了 MyBricks token
          const token = await vsCodeMessage?.call?.('getAIToken').catch(() => '') ?? ''
          setHasAIToken(typeof token === 'string' && token.trim() !== '')
        }

        setSPADesigner(() => designer)
      })
      .catch((err) => {
        console.error('[MyBricks] 动态加载失败:', err)
        message.error('设计器加载失败，请检查网络后刷新重试')
      })
  }, [])

  // 2. SPADesigner 就绪后，初始化设计器 config
  useEffect(() => {
    if (!SPADesigner || !aiChannel) return
    getDesignerConfig({ designerRef, aiChannel }).then((_config) => {
      setInitSuccess(true)
      config.current = _config
    })
  }, [SPADesigner, aiChannel])

  const refreshAIToken = useCallback(() => {
    // 只有 MyBricks 渠道才需要检查 token
    if (aiChannel !== 'mybricks') return
    if (!vsCodeMessage?.call) return
    vsCodeMessage.call('getAIToken').then((token: string) => {
      setHasAIToken(typeof token === 'string' && token.trim() !== '')
    }).catch(() => setHasAIToken(false))
  }, [aiChannel])

  // 手动切换渠道：持久化选择 → reload WebView
  const switchToMybricks = useCallback(async () => {
    if (!vsCodeMessage?.call) return
    await vsCodeMessage.call('setAIChannelOverride', { channel: 'mybricks' }).catch(() => {})
    vsCodeMessage.call('reloadWebview').catch(() => {})
  }, [])

  const switchToInfra = useCallback(async () => {
    if (!vsCodeMessage?.call) return
    await vsCodeMessage.call('setAIChannelOverride', { channel: null }).catch(() => {})
    vsCodeMessage.call('reloadWebview').catch(() => {})
  }, [])

  useEffect(() => {
    if (!initSuccess) return
    refreshAIToken()
  }, [initSuccess, refreshAIToken])

  useEffect(() => {
    if (!vsCodeMessage?.on) return
    const unsub = vsCodeMessage.on('aiTokenChanged', refreshAIToken)
    return () => unsub?.()
  }, [refreshAIToken])

  // MCP 状态与监听、handler 注册（不默认加载；开启但服务/ skill 未就绪时在设计器内提示）
  const { mcpEnabled, mcpServerReady } = useMCP(vsCodeMessage, {
    initSuccess,
    myBricksAPIRefGetter: () => myBricksAPIRef,
  })

  // 标记已编辑：触发保存按钮 * 号，并通知 extension 文档已变脏（VSCode 标签圆点）
  const markEdited = useCallback(() => {
    setChanged((c) => c + 1)

    // 通知 extension 内容已变更，由 VSCode CustomEditorProvider 驱动标签脏状态
    vsCodeMessage?.call('notifyContentChanged', {}).catch(() => {})

    // 自动保存已禁用：改为依赖 Ctrl+S（VSCode 原生保存机制）
    // if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    // autoSaveTimerRef.current = setTimeout(async () => {
    //   if (!vsCodeMessage?.call) return
    //   const fileResult = await vsCodeMessage.call('getFileContent').catch(() => null)
    //   const currentFilePath: string | null = fileResult?.path ?? null
    //   if (currentFilePath) {
    //     saveRef.current?.()
    //   } else {
    //     vsCodeMessage.call('notifyUnnamedFileDirty').catch(() => {})
    //   }
    // }, 1000)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    ;(window as any)._mybricksOnEdit_ = markEdited

    console.log('_mybricksOnEdit_', (window as any)._mybricksOnEdit_)
  }, [markEdited])

  // 保存：直接保存 dump() 的结果到当前设计文件（.ui / .mybricks）
  // silent=true 时自动保存静默执行，不弹成功/失败提示
  const save = useCallback(async (silent = false) => {
    const designer = designerRef.current
    if (!designer) {
      if (!silent) message.error('设计器未初始化')
      return
    }
    try {
      // 直接获取 dump 的 JSON 数据
      const json = designer.dump()
      if (!json) {
        if (!silent) message.error('无法获取设计器数据')
        return
      }

      if (!vsCodeMessage) {
        if (!silent) message.warning('当前环境无法保存，请使用 VSCode 插件')
        return
      }

      // 获取当前文件路径
      const fileResult = await vsCodeMessage.call('getFileContent')

      const currentFilePath = fileResult?.path ?? null

      // 保存 JSON 数据
      const res = await vsCodeMessage.call('saveProject', { saveContent: json, currentFilePath })
      if (res?.success) {
        setChanged(0)
        setLastSavedAt(new Date())
        if (res.path) {
          const savedName = extractFileName(res.path)
          setCurrentFileName(savedName)
          if (!silent) message.success(`已保存: ${savedName}`)
        } else {
          if (!silent) message.success('保存完成')
        }
      } else if (!silent && res?.message && res.message !== '用户取消保存') {
        message.error(res.message)
      }
    } catch (error) {
      console.error('保存失败:', error)
      if (!silent) message.error(error instanceof Error ? error.message : '保存失败')
    }
  }, [extractFileName])

  // 保持 saveRef 始终指向最新的 save（供防抖回调调用）
  useEffect(() => {
    saveRef.current = () => save(true)
  }, [save])

  // Ctrl+S 快捷键：extension 发送 triggerSave 通知时执行保存
  useEffect(() => {
    if (!vsCodeMessage?.on) return
    const unsub = vsCodeMessage.on('triggerSave', () => {
      save(true)
    })
    return () => unsub?.()
  }, [save])


  // 左边标题栏：文件名
  const titleBar = useMemo(() => (
    <div style={{
      flex: 1,
      minWidth: 0,
      width: '100%',
      fontSize: 13,
      fontWeight: 500,
      color: '#555',
      cursor: 'default',
      userSelect: 'none',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}>
      {currentFileName || '未命名文件'}
    </div>
  ), [currentFileName])

  // toolbar 传给 SPADesigner 的只是一个空容器，内容通过 createPortal 从 App 树注入
  // 这样 SPADesigner 缓存 toolbar 也无所谓，portal 内容始终随 App state 更新
  const toolbarBtns = useMemo(() => (
    <div id='mybricks-toolbar-root' style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: 8, paddingLeft: 10, paddingRight: 10, display: 'flex' }} />
  ), [])

  // SPADesigner onLoad 触发时 toolbar DOM 已渲染完毕，此时挂载 portal
  const [toolbarPortalRoot, setToolbarPortalRoot] = useState<Element | null>(null)
  const onDesignerLoad = useCallback(() => {
    setToolbarPortalRoot(document.getElementById('mybricks-toolbar-root'))
  }, [])

  return (
    <ToolbarContext.Provider value={{ lastSavedAt }}>
    <ConfigProvider {...ANTD_CONFIG}>
      <div className='ide'>
        {/* toolbar portal：从 App 树直接渲染到 SPADesigner 的 toolbar 容器内，state 更新可正常穿透 */}
        {toolbarPortalRoot && createPortal(
          <>
            <SaveTimeDisplay />
            <Popover
              trigger='click'
              placement='bottomRight'
              arrow={false}
              overlayInnerStyle={{
                padding: 0,
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                minWidth: 192,
                overflow: 'hidden',
              }}
              content={
                <div style={{ fontFamily: 'var(--vscode-editor-font-family, "SF Mono", Menlo, monospace)', fontSize: 12 }}>
                  <div style={{ padding: '8px 12px 7px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="var(--mybricks-color-primary)">
                      <path d="M7.443.505a1 1 0 011.114 0l6 4A1 1 0 0115 5.5v5a1 1 0 00-.443.995l-6 4a1 1 0 01-1.114 0l-6-4A1 1 0 011 10.5v-5a1 1 0 00.443-.995l6-4zM8 1.8L2.557 5.5 8 9.2l5.443-3.7L8 1.8zM2 6.756V10.5l5.5 3.667V10.42L2 6.756zM9.5 10.42v3.747L15 10.5V6.756L9.5 10.42z"/>
                    </svg>
                    <span style={{ color: '#111827', fontWeight: 600, fontSize: 12, letterSpacing: '0.01em' }}>依赖库信息</span>
                  </div>
                  <div style={{ padding: '8px 12px' }}>
                    {appVersion && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: designerVersion ? 5 : 0 }}>
                        <span style={{ color: '#9ca3af', fontSize: 11, letterSpacing: '0.02em' }}>version</span>
                        <span style={{ color: 'var(--mybricks-color-primary)', fontWeight: 700, fontSize: 12 }}>v{appVersion}</span>
                      </div>
                    )}
                    {designerVersion && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: pluginAIVersion ? 5 : 0 }}>
                        <span style={{ color: '#9ca3af', fontSize: 11, letterSpacing: '0.02em' }}>设计器</span>
                        <span style={{ color: '#374151', fontSize: 12 }}>v{designerVersion}</span>
                      </div>
                    )}
                    {pluginAIVersion && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: aiChannel ? 5 : 0 }}>
                        <span style={{ color: '#9ca3af', fontSize: 11, letterSpacing: '0.02em' }}>AI 插件</span>
                        <span style={{ color: '#374151', fontSize: 12 }}>v{pluginAIVersion}</span>
                      </div>
                    )}
                    {aiChannel && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#9ca3af', fontSize: 11, letterSpacing: '0.02em' }}>AI 渠道</span>
                        <span style={{ color: aiChannel === 'infra' ? '#374151' : 'var(--mybricks-color-primary)', fontSize: 12, fontWeight: aiChannel === 'mybricks' ? 600 : 400 }}>
                          {aiChannel === 'infra' ? '默认' : 'MyBricks'}
                        </span>
                      </div>
                    )}
                    {infraAvailable && aiChannel === 'infra' && (
                      <div style={{ marginTop: 8, paddingTop: 7, borderTop: '1px solid #e5e7eb' }}>
                        <button onClick={switchToMybricks} style={{ width: '100%', border: '1px solid var(--mybricks-color-primary)', borderRadius: 4, padding: '3px 0', cursor: 'pointer', fontSize: 11, color: 'var(--mybricks-color-primary)', background: '#fff', fontWeight: 500 }}>
                          切换至 MyBricks 渠道
                        </button>
                      </div>
                    )}
                    {infraAvailable && aiChannel === 'mybricks' && (
                      <div style={{ marginTop: 8, paddingTop: 7, borderTop: '1px solid #e5e7eb' }}>
                        <button onClick={switchToInfra} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 4, padding: '3px 0', cursor: 'pointer', fontSize: 11, color: '#374151', background: '#fff', fontWeight: 500 }}>
                          切换至默认渠道
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              }
            >
              <InfoCircleOutlined style={{ color: '#9ca3af', fontSize: 14, cursor: 'pointer' }} />
            </Popover>
          </>,
          toolbarPortalRoot
        )}
        {/* 顶部工具栏 */}
        {/* <div className='toolbar'>
          {titleBar}
          {toolbarBtns}
        </div> */}

        {/* 设计器主区域 */}
        <div className={'designer'}>
          {initSuccess && !hasAIToken && !aiTokenBannerClosed && (
            <div className='ai-token-banner'>
              <div className='ai-token-banner-row'>
                <span className='ai-token-banner-desc'>未配置请求凭证，所有AI 能力将不可用。</span>
                <span
                  className='ai-token-banner-action'
                  role='button'
                  tabIndex={0}
                  onClick={async () => {
                    try {
                      if (vsCodeMessage?.call) {
                        await vsCodeMessage.call('openAISettings')
                      } else {
                        message.info('请打开设置，搜索「MyBricks」→ AI 请求凭证')
                      }
                    } catch {
                      message.info('请打开设置，搜索「MyBricks」→ AI 请求凭证')
                    }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLElement).click()}
                >
                  去配置
                </span>
                <span
                  className='ai-token-banner-close'
                  onClick={() => setAITokenBannerClosed(true)}
                  role='button'
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setAITokenBannerClosed(true)}
                  aria-label='关闭'
                >
                  <CloseOutlined />
                </span>
              </div>
            </div>
          )}
          {mcpEnabled && !mcpServerReady && (
            <Alert
              message="MCP 已开启，但服务尚未连接"
              description="请确保已在 Cursor 中启动 MCP 服务，并将 MCP 与 Skill 配置到当前项目后再使用设计器 AI 能力。"
              type="info"
              showIcon
              style={{ margin: '8px 12px', flexShrink: 0 }}
            />
          )}
          {/* SPADesigner 动态加载完成 + config 初始化完成后才渲染 */}
          {initSuccess && SPADesigner && (
            <SPADesigner
              config={config.current}
              ref={designerRef}
              titlebar={() => titleBar}
              toolbar={() => toolbarBtns}
              onLoad={onDesignerLoad}
              onMessage={onMessage}
              onEdit={markEdited}
            />
          )}
          {/* SPADesigner 加载中占位 */}
          {!SPADesigner && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--vscode-descriptionForeground)',
              fontSize: 13,
            }}>
              获取设计器中...
            </div>
          )}
        </div>
      </div>
    </ConfigProvider>
    </ToolbarContext.Provider>
  )
}
