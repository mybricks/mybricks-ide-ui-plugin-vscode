/**
 * MyBricks 主应用组件
 */
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
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

  // 动态加载的 SPADesigner 组件（manifest 加载完才有值）
  const [SPADesigner, setSPADesigner] = useState<any>(null)

  // 初始化配置（依赖 manifest 加载完成后再执行）
  const [initSuccess, setInitSuccess] = useState(false)
  // 主版本（manifest 顶层 version）
  const [appVersion, setAppVersion] = useState<string | null>(null)
  // 设计器版本（manifest.designer.version）
  const [designerVersion, setDesignerVersion] = useState<string | null>(null)
  const config = useRef<any>(null)

  // 当前打开的文件名
  const [currentFileName, setCurrentFileName] = useState<string>('')

  // 从文件路径中提取文件名
  const extractFileName = useCallback((filePath: string) => {
    return filePath.split(/[/\\]/).pop() ?? filePath
  }, [])

  // 是否已配置 AI Token（用于展示横幅），监听 aiTokenChanged 更新
  const [hasAIToken, setHasAIToken] = useState(true)
  const [aiTokenBannerClosed, setAITokenBannerClosed] = useState(false)

  // 0. 启动时立即获取当前文件名（不等 SPADesigner 加载）
  useEffect(() => {
    if (!vsCodeMessage?.call) return
    vsCodeMessage.call('getFileContent').then((fileResult: any) => {
      const filePath: string = fileResult?.path ?? ''
      if (filePath) {
        setCurrentFileName(extractFileName(filePath))
      }
    }).catch(() => {})
  }, [])

  // 1. 启动时 fetch manifest → 动态加载 designer-spa
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
        
        let designerUrl = manifest?.designer?.url
        if (!designerUrl && dVer) {
          designerUrl = `https://f2.eckwai.com/kos/nlav12333/mybricks/designer-spa/${dVer}/index.min.js`
        }

        if (!designerUrl) {
          throw new Error('[manifest] designer.url 和 version 均为空')
        }
        return loadScript(designerUrl)
      })
      .then(() => {
        const designer = (window as any).mybricks?.SPADesigner
        if (!designer) {
          throw new Error('[manifest] 加载后 window.mybricks.SPADesigner 不存在')
        }
        setSPADesigner(() => designer)
      })
      .catch((err) => {
        console.error('[MyBricks] designer-spa 动态加载失败:', err)
        message.error('设计器加载失败，请检查网络后刷新重试')
      })
  }, [])

  // 2. SPADesigner 就绪后，初始化设计器 config
  useEffect(() => {
    if (!SPADesigner) return
    getDesignerConfig({ designerRef }).then((_config) => {
      setInitSuccess(true)
      config.current = _config
    })
  }, [SPADesigner])

  const refreshAIToken = useCallback(() => {
    if (!vsCodeMessage?.call) return
    // vsCodeMessage.call('getAIToken').then((token: string) => {
    //   setHasAIToken(typeof token === 'string' && token.trim() !== '')
    // }).catch(() => setHasAIToken(false))
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

  // 保存：直接保存 dump() 的结果到当前设计文件（.ui / .mybricks）
  const save = useCallback(async () => {
    const designer = designerRef.current
    if (!designer) {
      message.error('设计器未初始化')
      return
    }
    try {
      // 直接获取 dump 的 JSON 数据
      const json = designer.dump()
      if (!json) {
        message.error('无法获取设计器数据')
        return
      }

      if (!vsCodeMessage) {
        message.warning('当前环境无法保存，请使用 VSCode 插件')
        return
      }

      // 获取当前文件路径
      const fileResult = await vsCodeMessage.call('getFileContent')

      const currentFilePath = fileResult?.path ?? null

      // 保存 JSON 数据
      const res = await vsCodeMessage.call('saveProject', { saveContent: json, currentFilePath })
      if (res?.success) {
        setChanged(0)
        if (res.path) {
          const savedName = extractFileName(res.path)
          setCurrentFileName(savedName)
          message.success(`已保存: ${savedName}`)
        } else {
          message.success('保存完成')
        }
      } else if (res?.message && res.message !== '用户取消保存') {
        message.error(res.message)
      }
    } catch (error) {
      console.error('保存失败:', error)
      message.error(error instanceof Error ? error.message : '保存失败')
    }
  }, [extractFileName])

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
      {currentFileName || 'VibeUI'}
    </div>
  ), [currentFileName])

  // 右边工具栏按钮：设计器挂载点 + 保存按钮
  const toolbarBtns = useMemo(() => (
    <div style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: 8, paddingLeft: 10, paddingRight: 10, display: 'flex' }}>
        <button
          style={{
            border: 0,
            borderRadius: 6,
            padding: '3px 12px',
            margin: '0 2px',
            cursor: 'pointer',
            fontSize: 12,
            backgroundColor: 'var(--mybricks-color-primary)',
            color: '#fff',
            fontWeight: 'bold',
          }}
          onClick={save}
        >
          {changed ? '*' : ''}保存
        </button>

        <Popover
          trigger='hover'
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
              <div style={{
                padding: '8px 12px 7px',
                background: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#9ca3af', fontSize: 11, letterSpacing: '0.02em' }}>设计器</span>
                    <span style={{ color: '#374151', fontSize: 12 }}>v{designerVersion}</span>
                  </div>
                )}
              </div>
            </div>
          }
        >
          <InfoCircleOutlined style={{ color: '#9ca3af', fontSize: 14, cursor: 'pointer' }} />
        </Popover>
        {/* <Popover
          title='导出源码'
          open={exportPopoverVisible}
          onOpenChange={setExportPopoverVisible}
          trigger='click'
          placement='bottomRight'
          arrow={false}
          content={
            <ExportCode
              designerRef={designerRef}
              onClose={() => setExportPopoverVisible(false)}
            />
          }
        >
          <Tooltip title='导出源码'>
            <button className={'button'}>
              <VerticalAlignBottomOutlined />
              导出源码
            </button>
          </Tooltip>
        </Popover> */}
    </div>
  ), [changed, save, appVersion, designerVersion])

  return (
    <ConfigProvider {...ANTD_CONFIG}>
      <div className='ide'>
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
              onLoad={(e) => console.log('loaded')}
              onMessage={onMessage}
              onEdit={() => setChanged(changed + 1)}
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
  )
}
