/**
 * MyBricks 主应用组件
 */
import React, { useState, useRef, useCallback, useEffect } from 'react'
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
import { VerticalAlignBottomOutlined, CloseOutlined } from '@ant-design/icons'
import ExportCode from './components/export-code'
import { config as getDesignerConfig } from './config'
import { useMCP } from './ai/mcp'

// MyBricks SPA Designer 引擎
const { SPADesigner } = (window as any).mybricks

const ANTD_CONFIG = {
  theme: {
    token: {
      colorPrimary: 'var(--mybricks-color-primary)',
    },
  },
}

const vsCodeMessage = (window as any).webViewMessageApi

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
  const designerRef = useRef(null)

  // MyBricksAPI 实例缓存
  const myBricksAPIRef = useRef(null)

  // 初始化配置
  const [initSuccess, setInitSuccess] = useState(false)
  const config = useRef(null)
  // 是否已配置 AI Token（用于展示横幅），监听 aiTokenChanged 更新
  const [hasAIToken, setHasAIToken] = useState(true)
  const [aiTokenBannerClosed, setAITokenBannerClosed] = useState(false)

  useEffect(() => {
    getDesignerConfig({ designerRef }).then((_config) => {
      setInitSuccess(true)
      config.current = _config
    })
  }, [designerRef])

  const refreshAIToken = useCallback(() => {
    if (!vsCodeMessage?.call) return
    vsCodeMessage.call('getAIToken').then((token: string) => {
      setHasAIToken(typeof token === 'string' && token.trim() !== '')
    }).catch(() => setHasAIToken(false))
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
        message.success(res.path ? `已保存: ${res.path.split(/[/\\]/).pop()}` : '保存完成')
      } else if (res?.message && res.message !== '用户取消保存') {
        message.error(res.message)
      }
    } catch (error) {
      console.error('保存失败:', error)
      message.error(error instanceof Error ? error.message : '保存失败')
    }
  }, [])

  return (
    <ConfigProvider {...ANTD_CONFIG}>
      <div className='ide'>
        {/* 顶部工具栏 */}
        <div className='toolbar'>
          <div className={'logo'}>MyBricks</div>
          <div className={'btns'} id={'toolbarBtns'} />
          <Space>
            <button className={'button primary'} onClick={save}>
              {changed ? '*' : ''}保存
            </button>
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
          </Space>
        </div>

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
          {initSuccess && (
            <SPADesigner
              config={config.current}
              ref={designerRef}
              onLoad={(e) => console.log('loaded')}
              onMessage={onMessage}
              onEdit={() => setChanged(changed + 1)}
            />
          )}
        </div>
      </div>
    </ConfigProvider>
  )
}
