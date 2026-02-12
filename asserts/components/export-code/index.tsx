import React, { useState, useEffect, useCallback } from 'react'
import { Form, Input, Button, Radio, Space, message, Select, Flex } from 'antd'
import { ExportOutlined } from '@ant-design/icons'
import toCode from '@mybricks/to-target-code'

const vsCodeMessage = (window as any).webViewMessageApi
const STORAGE_KEY_EXPORT = '--mybricks-export-config-'

type ExportConfig = {
  exportType: 'project' | 'component'
  projectName: string
  exportDir?: string
  techStack: 'react' | 'vue'
}

interface ExportCodeProps {
  designerRef: any
  sceneId?: string
  onClose?: () => void
  style?: React.CSSProperties
  simpleMode?: boolean // If true, simplified UI for sidebar
}

export default function ExportCode({ designerRef, sceneId, onClose, style, simpleMode = false }: ExportCodeProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [writeFullPath, setWriteFullPath] = useState('')
  
  // Watch form values for path calculation
  const exportDir = Form.useWatch('exportDir', form)
  const projectName = Form.useWatch('projectName', form)
  
  const defaultValues: ExportConfig = {
    exportType: 'component',
    projectName: 'my_project',
    exportDir: '.',
    techStack: 'react',
    ...(typeof localStorage !== 'undefined'
      ? JSON.parse(localStorage.getItem(STORAGE_KEY_EXPORT) || '{}')
      : {}),
  }

  const [formValues, setFormValues] = useState<ExportConfig>(defaultValues)

  const effectiveBasePath =
    exportDir !== undefined && exportDir !== ''
      ? `${String(exportDir).replace(/\\/g, '/').replace(/\/+$/, '')}/${projectName || ''}`
      : projectName || ''

  // Calculate full path
  useEffect(() => {
    if (!effectiveBasePath) {
      setWriteFullPath('')
      return
    }
    vsCodeMessage?.call('getExportFullPath', { basePath: effectiveBasePath }).then((res: { fullPath?: string }) => {
      setWriteFullPath(res?.fullPath ?? effectiveBasePath)
    })
  }, [effectiveBasePath])

  // Initialize with defaults from VSCode extension if available
  useEffect(() => {
    vsCodeMessage?.call('getCurrentExportDefaults').then((res: { projectName?: string; exportDir?: string }) => {
      if (res?.projectName != null || res?.exportDir != null) {
        const updates = {
          projectName: res.projectName ?? form.getFieldValue('projectName'),
          exportDir: res.exportDir ?? form.getFieldValue('exportDir'),
        }
        form.setFieldsValue(updates)
        saveToStorage(updates)
      }
    })
  }, [form])

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
    vsCodeMessage?.call('selectExportDir').then((res: { path?: string }) => {
      if (res?.path !== undefined) {
        form.setFieldValue('exportDir', res.path)
        saveToStorage({ exportDir: res.path })
      }
    })
  }, [form, saveToStorage])

  const handleExport = useCallback(async () => {
    if (!designerRef.current) return
    
    try {
      const values = await form.validateFields()
      setLoading(true)
      
      const configJson = designerRef.current.toJSON({
        withDiagrams: true,
        withIOSchema: true,
      })
      
      if (!configJson) {
        message.error('获取页面数据失败')
        return
      }

      const result = toCode(configJson, { target: values.techStack || 'react', sceneId })
      
      if (!result || !Array.isArray(result) || result.length === 0) {
        message.error('代码生成失败，返回结果格式不正确')
        return
      }

      const projectMode = values.exportType === 'project'
      const basePath = effectiveBasePath

      const writeRes = await vsCodeMessage.call('writeWorkspaceFiles', {
        basePath,
        results: result,
        projectMode,
      })

      if (writeRes?.error) {
        message.error(`导出失败: ${writeRes.error}`)
      } else {
        const written = (writeRes && writeRes.written) || []
        message.success(`代码已导出到 ${basePath}${written.length ? ` (${written.length} 个文件)` : ''}`)
        onClose?.()
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出失败')
    } finally {
      setLoading(false)
    }
  }, [designerRef, sceneId, effectiveBasePath, onClose])

  const pathSelectionUI = effectiveBasePath && (
    <Form.Item label={simpleMode ? undefined : ''} className='export-form-write-path'>
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
  )

  if (simpleMode) {
    return (
      <Form
        form={form}
        layout='vertical'
        size='small'
        initialValues={defaultValues}
        className='export-form'
        style={{ width: '100%', ...style }}
      >
        <Form.Item name='exportDir' noStyle>
          <Input style={{ display: 'none' }} />
        </Form.Item>

        <div style={{ marginBottom: 12 }}>
           {/* <Flex gap="small" style={{ marginBottom: 12 }}>
             <Form.Item name="exportType" noStyle>
                <Select 
                  style={{ flex: 1 }} 
                  options={[
                    { label: '导出为组件', value: 'component' },
                    { label: '导出为项目', value: 'project' },
                  ]}
                  onChange={(v) => saveToStorage({ exportType: v })}
                />
             </Form.Item>
             <Form.Item name="techStack" noStyle>
                <Select 
                  style={{ flex: 1 }} 
                  disabled
                  options={[
                    { label: 'React', value: 'react' },
                  ]}
                />
             </Form.Item>
           </Flex> */}
           <Form.Item 
             name="projectName" 
             rules={[{ required: true, message: '请输入项目名' }]}
             style={{ marginBottom: 12 }}
           >
             <Input placeholder="项目名称" onChange={(e) => saveToStorage({ projectName: e.target.value })}/>
           </Form.Item>
        </div>

        {pathSelectionUI}

        <Form.Item style={{ marginBottom: 0 }}>
          <button
            className='button secondary'
            onClick={handleExport}
            disabled={loading}
            style={{
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '导出中...' : <><ExportOutlined /> 导出代码</>}
          </button>
        </Form.Item>
      </Form>
    )
  }

  return (
    <Form
      form={form}
      layout='vertical'
      size='small'
      initialValues={defaultValues}
      className='export-form'
      style={style}
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

      {pathSelectionUI}

      <Form.Item style={{ marginBottom: 0 }} className='export-form-actions'>
        <Flex gap='small' justify='flex-end'>
          <Button onClick={onClose}>取消</Button>
          <Button
            type='primary'
            disabled={!projectName}
            loading={loading}
            onClick={handleExport}
          >
            导出
          </Button>
        </Flex>
      </Form.Item>
    </Form>
  )
}
