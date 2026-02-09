/**
 * MyBricks 应用入口
 */
import React from 'react'
import ReactDOM from 'react-dom/client'

import './config' // 引入配置,将 config 函数挂载到 window

console.log('>>> window.React:', (window as any).React)
console.log('>>> window.ReactDOM:', (window as any).ReactDOM)
console.log('>>> window.antd:', (window as any).antd)
console.log('>>> window.icons:', (window as any).icons)

import App from './app'

const rootEl = document.getElementById('root')

if (rootEl) {
  const root = ReactDOM.createRoot(rootEl)
  root.render(<App />)
}
