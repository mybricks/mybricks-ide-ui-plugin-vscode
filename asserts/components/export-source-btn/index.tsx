import React, { useState, useCallback, useEffect } from 'react'
import { exportCodeToVSCode } from '../../code-export-vscode-adapter'
import { generateAiExportFilesFromResources } from '../code-export'

const vsCodeMessage = (window as any).webViewMessageApi

const buttonStyle: React.CSSProperties = {
  cursor: 'pointer',
  width: '100%',
  textAlign: 'center',
  height: 26,
  lineHeight: '26px',
  borderRadius: 6,
  border: '1px solid rgba(2, 9, 16, 0.13)',
  backgroundColor: 'var(--mybricks-bg-color-hover, #F5F5F5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  color: 'var(--mybricks-text-color-main)',
  padding: 0,
  boxSizing: 'border-box',
}

function showNotification(type: 'info' | 'warning' | 'error', msg: string, revealPath?: string) {
  if (vsCodeMessage?.call) {
    vsCodeMessage.call('showNotification', { type, message: msg, revealPath: revealPath || '' })
  } else {
    console.log(`[${type}] ${msg}`)
  }
}

const ExportSourceBtn: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState<string>('mybricks-app')
  const [exportDir, setExportDir] = useState<string>('.')

  useEffect(() => {
    if (!vsCodeMessage?.call) return
    vsCodeMessage.call('getCurrentExportDefaults').then((res: { projectName?: string; exportDir?: string }) => {
      if (res?.projectName) setFileName(res.projectName)
      if (res?.exportDir) setExportDir(res.exportDir)
    }).catch(() => {})
  }, [])

  const handleExport = useCallback(async () => {
    const forApp = (window as any)?._forApp_
    if (!forApp || typeof forApp._getResourcesCode_ !== 'function') {
      showNotification('error', 'window._forApp_._getResourcesCode_ 不可用，请确认组件已加载')
      return
    }

    setLoading(true)
    try {
      const resourceResult = forApp._getResourcesCode_('application')
      if (!resourceResult || (Array.isArray(resourceResult) && resourceResult.length === 0)) {
        showNotification('error', '未获取到导出数据')
        return
      }

      const exportFiles = await generateAiExportFilesFromResources(resourceResult)
      if (!exportFiles.length) {
        showNotification('error', '未生成可导出的源代码文件')
        return
      }

      const pathRes = await vsCodeMessage.call('resolveExportPath', { projectName: fileName, exportDir })
      if (pathRes?.error) {
        showNotification('error', `路径解析失败: ${pathRes.error}`)
        return
      }

      await exportCodeToVSCode(exportFiles, {
        folderName: '',
        outputDir: pathRes.basePath,
        onProgress: (progress) => {
          console.log(`[导出源代码] ${progress.progress}% - ${progress.currentFile}`)
        },
      })

      showNotification('info', `导出源代码成功！路径：${pathRes.fullPath}`, pathRes.fullPath)
    } catch (error: any) {
      if (error?.message?.includes('取消')) {
        console.log('[导出源代码] 用户取消')
      } else {
        console.error('[导出源代码] 导出失败', error)
        showNotification('error', `导出失败: ${error?.message || '未知错误'}`)
      }
    } finally {
      setLoading(false)
    }
  }, [fileName, exportDir])

  return (
    <div style={{ padding: '4px 0' }}>
      <button
        type="button"
        disabled={loading}
        onClick={handleExport}
        style={{
          ...buttonStyle,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '导出中...' : '导出源代码'}
      </button>
    </div>
  )
}

export default ExportSourceBtn
