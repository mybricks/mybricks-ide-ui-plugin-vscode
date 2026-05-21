# 简介

Taro 官方基础组件库，提供各类通用基础视图与交互组件。

## 如何引用

引用Taro组件需要遵循此按需引用的方式

```jsx
import { Input } from "@tarojs/components";
```

## 注意事项

- 当有样式需求时，所有组件都可以使用className属性，可以自定义样式。
- **Input** 为了保障输入内容垂直居中，建议
  - 同时设置css样式`height`、`line-height`，例如：`height: 40px; line-height: 40px;`
  - 使用`padding` 来控制输入框的高度，例如：`padding: 10px 20px;`
- **Text** 默认是内联元素，需要设置css样式`display: block;` 才能作为块级元素，更推荐用 View 做块级结构、用 Text 做文本承载
