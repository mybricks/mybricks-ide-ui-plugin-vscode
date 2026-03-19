import React, { useState, useEffect, useCallback } from 'react'

const vsCodeMessage = (window as any).webViewMessageApi

export default function FilePath() {
  const [filePath, setFilePath] = useState<string>('')

  useEffect(() => {
    if (!vsCodeMessage?.call) return
    vsCodeMessage
      .call('getFileContent')
      .then((result: any) => {
        const p: string = result?.path ?? ''
        setFilePath(p)
      })
      .catch(() => {})
  }, [])

  const openInFinder = useCallback(() => {
    if (!filePath || !vsCodeMessage?.call) return
    vsCodeMessage.call('revealInOS', { filePath })
  }, [filePath])

  if (!filePath) return null

  // 取文件名和父目录
  const parts = filePath.replace(/\\/g, '/').split('/')
  const fileName = parts.pop() ?? filePath
  const dir = parts.join('/') || '/'

  return (
    <div
      onClick={openInFinder}
      title={`${filePath}\n点击在文件管理器中打开`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && openInFinder()}
      style={{
        backgroundColor: '#f5f7fa',
        border: '1px solid #e8e8e8',
        borderRadius: 4,
        padding: '6px 8px',
        fontSize: 10,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        marginBottom: 2,
      }}
    >
      <div style={{
        fontWeight: 500,
        color: 'rgba(0,0,0,0.75)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {fileName}
      </div>
      <div style={{
        color: '#999',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {dir}
      </div>
    </div>
  )
}
