# 简介

Taro 的 API 包括 Taro 内置提供的 API 以及对小程序的端能力 API 的封装

## 如何引用
```tsx
import Taro from '@tarojs/taro'

Taro.showToast({
  title: '成功',
  icon: 'success',
  duration: 2000
})
```

## 注意事项
Taro 已经将各端的api都进行了封装，编码无需关注多端差异，都使用 \`Taro. + API 名称\` 来进行调用

### app.config.ts文件配置
- 禁止使用 import { defineAppConfig } from 'mybricks'
- tabBar.list[number].iconPath、tabBar.list[number].selectedIconPath 支持使用网络图片配置，禁止使用绝对路径