import React, { useState, useEffect, useCallback } from 'react'

const vsCodeMessage = (window as any).webViewMessageApi

export default function TokenConfig() {
  const [hasToken, setHasToken] = useState<boolean | null>(null)

  const refresh = useCallback(() => {
    if (!vsCodeMessage?.call) {
      setHasToken(false)
      return
    }
    vsCodeMessage
      .call('getAIToken')
      .then((token: string) => setHasToken(typeof token === 'string' && token.trim().length > 0))
      .catch(() => setHasToken(false))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!vsCodeMessage?.on) return
    const unsub = vsCodeMessage.on('aiTokenChanged', refresh)
    return () => unsub?.()
  }, [refresh])

  const openSettings = useCallback(() => {
    vsCodeMessage?.call('openAISettings')
  }, [])

  const statusText = hasToken === null ? '加载中…' : (hasToken ? '已配置' : '未配置')
  const actionText = hasToken ? '查看配置' : '去配置'
  const statusStyle = hasToken === true ? { color: '#52c41a' } : (hasToken === false ? { color: '#faad14' } : { color: 'var(--mybricks-text-color-main)' })

  return (
    <>
      <div style={{
        backgroundColor: 'var(--mybricks-bg-color-hover)',
        // border: '1px solid #e8e8e8',
        borderRadius: 4,
        padding: '6px 8px',
        fontSize: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ ...statusStyle, fontSize: 10, fontWeight: 500 }}>{statusText}</span>
          <span
            onClick={openSettings}
            role='button'
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openSettings()}
            style={{ color: 'var(--mybricks-color-primary)', cursor: 'pointer', fontSize: 11 }}
          >
            {actionText}
          </span>
        </div>
      </div>
      <div style={{ color: 'var(--mybricks-text-color-main)', fontSize: 10, lineHeight: '14px', marginTop: 6, opacity: 0.45 }}>
        只有配置了请求凭证才可以使用AI
      </div>
    </>
  )
}
