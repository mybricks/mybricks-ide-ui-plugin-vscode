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
import { VerticalAlignBottomOutlined } from '@ant-design/icons'
import toCode from '@mybricks/to-target-code'
import { config as getDesignerConfig } from './config'
import { useMCP } from './ai/mcp'

// MyBricks SPA Designer 引擎
const { SPADesigner } = (window as any).mybricks

const ANTD_CONFIG = {
  theme: {
    token: {
      colorPrimary: '#fa6400',
    },
  },
}

const STORAGE_KEY_EXPORT = '--mybricks-export-config-'
type ExportConfig = {
  exportType: 'project' | 'component'
  projectName: string
  exportDir?: string
}

const vsCodeMessage = (window as any).webViewMessageApi

/**
 * 主应用组件
 */
export default function App() {
  // 内容变更计数
  const [changed, setChanged] = useState(0)

  const [exportPopoverVisible, setExportPopoverVisible] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

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
  useEffect(() => {
    getDesignerConfig({
      designerRef,
    }).then((_config) => {
      setInitSuccess(true)
      config.current = _config
    })
  }, [designerRef])

  // MCP 状态与监听、handler 注册（不默认加载；开启但服务/ skill 未就绪时在设计器内提示）
  const { mcpEnabled, mcpServerReady } = useMCP(vsCodeMessage, {
    initSuccess,
    myBricksAPIRefGetter: () => myBricksAPIRef,
  })

  // 保存：直接保存 dump() 的结果到 .mybricks 文件
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

  // 导出源码（出码逻辑）：同步到指定目录，无 zip
  const handleExportSource = useCallback(
    async (values: ExportConfig & { exportType: 'project' | 'component' }) => {
      setExportLoading(true)
      onMessage('loading', '导出中...', 0)
      try {
        const configJson = designerRef.current?.toJSON({
          withDiagrams: true,
          withIOSchema: true,
        })
        if (!configJson) {
          onMessage('error', '获取页面数据失败')
          return
        }
        const result = toCode(configJson, { target: 'react' })
        if (!result || !Array.isArray(result) || result.length === 0) {
          onMessage('error', '代码生成失败，返回结果格式不正确')
          return
        }
        const projectMode = values.exportType === 'project'
        const basePath = values.exportDir
          ? `${values.exportDir.replace(/\\/g, '/').replace(/\/+$/, '')}/${values.projectName}`
          : values.projectName
        const writeRes = await vsCodeMessage.call('writeWorkspaceFiles', {
          basePath,
          results: result,
          projectMode,
        })
        if (writeRes?.error) {
          onMessage('error', `写入工作区失败: ${writeRes.error}`)
          return
        }
        const written = (writeRes && writeRes.written) || []
        onMessage('success', `代码已导出到 ${basePath}${written.length ? ` (${written.length} 个文件)` : ''}`)
        setExportPopoverVisible(false)
      } catch (error) {
        onMessage('error', error instanceof Error ? error.message : '导出失败')
      } finally {
        setExportLoading(false)
      }
    },
    []
  )

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
            <Popover
              title='导出源码'
              open={exportPopoverVisible}
              onOpenChange={setExportPopoverVisible}
              trigger='click'
              placement='bottomRight'
              arrow={false}
              content={
                <ExportContent
                  open={exportPopoverVisible}
                  onSync={handleExportSource}
                  onClose={() => setExportPopoverVisible(false)}
                  loading={exportLoading}
                />
              }
            >
              <Tooltip title='导出源码'>
                <button className={'button'}>
                  <VerticalAlignBottomOutlined />
                  导出源码
                </button>
              </Tooltip>
            </Popover>
          </Space>
        </div>

        {/* 设计器主区域 */}
        <div className={'designer'}>
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

function ExportContent(props: {
  open?: boolean
  onClose: () => void
  onSync: (values: ExportConfig & { exportType: 'project' | 'component' }) => void
  loading?: boolean
}) {
  const { open, onClose, onSync, loading } = props
  const defaultValues: ExportConfig = {
    exportType: 'component',
    projectName: 'my_project',
    exportDir: '.',
    ...(typeof localStorage !== 'undefined'
      ? JSON.parse(localStorage.getItem(STORAGE_KEY_EXPORT) || '{}')
      : {}),
  }
  const [form] = Form.useForm()
  const [formValues, setFormValues] = useState<ExportConfig>(defaultValues)
  const exportDir = Form.useWatch('exportDir', form) ?? formValues.exportDir
  const projectName = Form.useWatch('projectName', form) ?? formValues.projectName
  const effectiveBasePath =
    exportDir !== undefined && exportDir !== ''
      ? `${String(exportDir).replace(/\\/g, '/').replace(/\/+$/, '')}/${projectName || ''}`
      : projectName || ''

  const [writeFullPath, setWriteFullPath] = useState('')
  useEffect(() => {
    if (!effectiveBasePath) {
      setWriteFullPath('')
      console.log('[导出] effectiveBasePath 为空，清空 writeFullPath')
      return
    }
    console.log('[导出] effectiveBasePath 变化，请求完整路径', { effectiveBasePath })
    vsCodeMessage?.call('getExportFullPath', { basePath: effectiveBasePath }).then((res: { fullPath?: string }) => {
      const full = res?.fullPath ?? effectiveBasePath
      setWriteFullPath(full)
      console.log('[导出] getExportFullPath 返回', { basePath: effectiveBasePath, fullPath: full })
    })
  }, [effectiveBasePath])

  // 打开弹窗时用当前 .mybricks 文件填充：项目名 = 文件名，导出目录 = 文件同级
  useEffect(() => {
    if (!open) return
    console.log('[导出] 弹窗打开，请求 getCurrentExportDefaults')
    vsCodeMessage?.call('getCurrentExportDefaults').then((res: { projectName?: string; exportDir?: string }) => {
      console.log('[导出] getCurrentExportDefaults 返回', res)
      if (res?.projectName != null || res?.exportDir != null) {
        const updates = {
          projectName: res.projectName ?? form.getFieldValue('projectName'),
          exportDir: res.exportDir ?? form.getFieldValue('exportDir'),
        }
        form.setFieldsValue(updates)
        setFormValues((prev) => ({ ...prev, ...updates }))
      }
    })
  }, [open, form])

  const saveToStorage = useCallback(
    (updates: Partial<ExportConfig>) => {
      const next = { ...form.getFieldsValue(), ...updates } as ExportConfig
      setFormValues(next)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_EXPORT, JSON.stringify(next))
      }
    },
    [form]
  )

  const onSelectDir = useCallback(() => {
    console.log('[导出] 用户点击选择路径，调用 selectExportDir')
    vsCodeMessage?.call('selectExportDir').then((res: { path?: string }) => {
      console.log('[导出] selectExportDir 返回', res)
      if (res?.path !== undefined) {
        const projectNameVal = form.getFieldValue('projectName') || ''
        const newBasePath = `${String(res.path).replace(/\\/g, '/').replace(/\/+$/, '')}/${projectNameVal}`
        console.log('[导出] 设置 exportDir 并回显', { selectedPath: res.path, projectName: projectNameVal, newBasePath })
        form.setFieldValue('exportDir', res.path)
        setFormValues((prev) => ({ ...prev, exportDir: res.path }))
        saveToStorage({ exportDir: res.path })
        // 选择后立即请求完整路径并回显
        vsCodeMessage?.call('getExportFullPath', { basePath: newBasePath }).then((fullRes: { fullPath?: string }) => {
          const full = fullRes?.fullPath ?? newBasePath
          setWriteFullPath(full)
          console.log('[导出] 选择路径后 getExportFullPath 返回', { newBasePath, fullPath: full })
        })
      } else {
        console.log('[导出] selectExportDir 未返回 path，可能用户取消选择')
      }
    })
  }, [form, saveToStorage])

  const handleSync = useCallback(() => {
    form.validateFields().then((values: ExportConfig) => {
      onSync({ ...values, exportType: values.exportType || 'project' })
    })
  }, [form, onSync])

  return (
    <Form
      className='export-form'
      form={form}
      layout='vertical'
      size='small'
      initialValues={defaultValues}
    >
      <Form.Item name='exportDir' noStyle>
        <Input style={{ display: 'none' }} />
      </Form.Item>
      <Form.Item label='导出类型' name='exportType' className='export-form-type'>
        <Radio.Group onChange={(e) => saveToStorage({ exportType: e.target.value })}>
          <Space direction='vertical' size={0} style={{ width: '100%' }}>
            <Radio value='component'>
              <span className='export-form-radio-block'>
                <span className='export-form-radio-label'>组件源码</span>
                <span className='export-form-radio-desc'>可嵌入到现有项目中作为组件使用</span>
              </span>
            </Radio>
            <Radio value='project'>
              <span className='export-form-radio-block'>
                <span className='export-form-radio-label'>项目源码</span>
                <span className='export-form-radio-desc'>独立可运行，可直接启动预览</span>
              </span>
            </Radio>
          </Space>
        </Radio.Group>
      </Form.Item>
      <Form.Item
        label='文件夹'
        name='projectName'
        rules={[
          {
            validator: (_, value: string) =>
              /^[a-zA-Z][a-zA-Z0-9_]*$/.test(value ?? '')
                ? Promise.resolve()
                : Promise.reject(
                    new Error('以字母开头，仅支持字母、数字以及下划线')
                  ),
          },
        ]}
      >
        <Input
          placeholder='请输入文件夹名'
          onBlur={() => {
            form.validateFields(['projectName']).then((values: ExportConfig) => {
              saveToStorage({ projectName: values.projectName })
            })
          }}
        />
      </Form.Item>
      {effectiveBasePath && (
        <Form.Item label='' className='export-form-write-path'>
          <div className='export-form-write-path-box'>
            <div className='export-form-write-path-desc'>源码文件将会写入到此目录</div>
            <div className='export-form-write-path-row'>
              <div className='export-form-write-path-value' title={writeFullPath || effectiveBasePath}>
                {writeFullPath || effectiveBasePath || '正在解析…'}
              </div>
              <span className='export-form-write-path-select' onClick={onSelectDir} role='button' tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelectDir()}>
                选择路径
              </span>
            </div>
          </div>
        </Form.Item>
      )}
      <Form.Item style={{ marginBottom: 0 }} className='export-form-actions'>
        <Flex gap='small' justify='flex-end'>
          <Button onClick={onClose}>取消</Button>
          <Button
            type='primary'
            disabled={!projectName}
            loading={loading}
            onClick={handleSync}
          >
            导出
          </Button>
        </Flex>
      </Form.Item>
    </Form>
  )
}
