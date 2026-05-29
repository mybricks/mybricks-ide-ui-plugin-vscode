import React from 'react'
import * as Taro from '@tarojs/taro'
import { LeftOutlined } from '@ant-design/icons'

const ActionBar = () => {
  return (
    <div
      style={{
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 999,
      transform: 'translateY(calc(-100% - 4px))'
    }}>
      <div
        style={{
          height: 26,
          padding: '0 8px',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 12,
          transition: 'background 0.2s ease',
          color: 'var(--mybricks-text-color-main)',
          background: 'var(--mybricks-bg-color-main)',
          boxShadow: 'var(--mybricks-shadow-main)'
        }}
        onClick={() => {
          Taro.navigateBack()
        }}
      >
        <LeftOutlined />
        <span>返回</span>
      </div>
    </div>
  )
}

export { ActionBar }
