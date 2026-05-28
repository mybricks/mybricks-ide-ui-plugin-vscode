import React, { useState, useCallback, useEffect } from 'react'
import { exportCodeToVSCode } from '../../code-export-vscode-adapter'
import { CodeTransformer } from './code-transformer'

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

/** 从 designerRef 中提取源代码文件列表 */
function getDesignerFiles(designerRef: any): Array<any> | null {
  const coms = designerRef.current?.toJSON()?.scenes?.[0]?.coms
  if (!coms) return null

  const comId = Object.keys(coms)[0]
  if (!comId) return null

  const files = coms[comId].model?.data?.files
  if (!files || !Array.isArray(files)) return null

  return files
}

export default function ExportSourceBtn({ designerRef }) {
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
      const files = getDesignerFiles(designerRef)
      if (!files) {
        showNotification('error', '未获取到源代码内容')
        return
      }

      const transformer = new CodeTransformer()

      const transformerFiles = transformer.transformFiles(files.filter(({ fileName }) => {
        return fileName !== 'setup.ts'
      }).map((file) => {
        return {
          path: file.fileName,
          content: decodeURIComponent(file.source)
        }
      }))

      // 让后端用 path.join 安全算出 basePath 和绝对路径，避免前端跨平台拼接
      const pathRes = await vsCodeMessage.call('resolveExportPath', { projectName: fileName, exportDir })
      if (pathRes?.error) {
        showNotification('error', `路径解析失败: ${pathRes.error}`)
        return
      }

      // 用 basePath 作为 outputDir，跳过目录选择弹窗，直接写入
      await exportCodeToVSCode(transformerFiles.map((file) => {
        return {
          fileName: file.path,
          content: file.content
        }
      }), {
        folderName: '',       // basePath 已包含 projectName，folderName 留空
        outputDir: pathRes.basePath,
        onProgress: (progress) => {
          console.log(`[导出源代码] ${progress.progress}% - ${progress.currentFile}`)
        },
      })

      // 通知展示后端返回的绝对路径
      showNotification('info', `导出源代码成功！路径：${pathRes.fullPath}`, pathRes.fullPath)
    } catch (error: any) {
      console.error(error)
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