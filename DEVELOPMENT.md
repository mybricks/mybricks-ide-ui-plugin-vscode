# MyBricks UI Plugin - 开发指南

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 编译项目
```bash
npm run compile
```

### 3. 启动调试
按 `F5` 或在调试面板选择 "运行扩展 (Run Extension)"

## 项目结构

```
MyBricks-UI-Plugin/
├── src/
│   ├── extension.ts          # 插件入口文件
│   ├── hooks.js              # 生命周期钩子
│   ├── subscriptions.js      # 命令和视图注册
│   ├── event.js              # 事件处理
│   ├── registerHandler.js    # 消息处理器
│   └── renderer/             # Webview 渲染器
│       ├── index.js          # 统一导出
│       ├── webviewPanel/     # 主面板视图
│       │   ├── index.js
│       │   └── index.html
│       └── webviewView/      # 侧边栏视图
│           ├── index.js
│           └── index.html
├── utils/
│   ├── utils.js              # 通用工具
│   ├── messageApi.js         # Webview 消息通信
│   ├── saveProject.js        # 项目保存/读取
│   └── exportProject.js      # 项目导出
├── asserts/                  # 前端资源
│   ├── app.tsx               # 主应用
│   ├── config.tsx            # MyBricks 配置
│   └── ...
└── out/                      # 编译输出目录

```

## 调试配置

### 方式一：普通运行
1. 按 `F5` 启动
2. 在新窗口（Extension Development Host）中测试
3. 在源码中设置断点进行调试

### 方式二：Watch 模式
1. 选择 "运行扩展 (Watch 模式)"
2. 代码修改后自动重新编译
3. 按 `Ctrl+R` (Mac: `Cmd+R`) 重新加载扩展

### 方式三：附加模式
1. 先手动启动扩展
2. 选择 "附加到扩展 (Attach to Extension)"

## 核心功能

### 命令
- `mybricks.openIDE` - 打开 MyBricks 设计器面板

### 视图
- 侧边栏视图 `mybricks.ide` - 快速访问入口

### Webview 通信
扩展与 Webview 之间通过 MessageAPI 进行通信：

#### 已注册的处理器
- `getFileContent` - 获取项目文件内容
- `saveFileContent` - 保存项目文件
- `exportProject` - 导出项目

## 常见问题

### Q: 修改代码后不生效？
A: 在 Extension Development Host 窗口按 `Ctrl+R` (Mac: `Cmd+R`) 重新加载

### Q: Webview 显示空白？
A: 检查浏览器控制台（帮助 > 切换开发者工具）查看错误信息

### Q: 找不到模块？
A: 运行 `npm run compile` 重新编译

## 开发技巧

1. **查看日志**：使用 `console.log()` 输出到调试控制台
2. **Webview 调试**：在 Extension Development Host 中打开开发者工具
3. **断点调试**：在 `.ts` 和 `.js` 文件中设置断点
4. **快速重载**：使用 Watch 模式进行开发

## 构建命令

- `npm run compile` - 编译 TypeScript 并复制资源文件
- `npm run watch` - 监听文件变化自动编译
- `npm run copy-resources` - 复制 HTML 资源文件

## 注意事项

1. 修改 HTML 文件后需要重新运行 `npm run compile` 或 `npm run copy-resources`
2. TypeScript 配置已设置为编译所有 JS 和 TS 文件
3. Source Maps 已启用，支持源码级调试
