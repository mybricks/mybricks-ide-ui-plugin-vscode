# MyBricks.ai VSCode 插件 — 开发调试

## 1. 安装依赖

```bash
npm install
```

## 2. toCode 包路径（用出码功能时必配）

出码依赖 **@mybricks/to-target-code**，在 **vite.config.ts** 里把 alias 指到你本地的 toTargetCode 入口：

```ts
'@mybricks/to-target-code': path.resolve(__dirname, '你的路径/code-next/src/toTargetCode/index.ts'),
```

## 3. 调试

用 VSCode 打开本仓库，按 **F5** 选「运行扩展」即可。`.vscode/launch.json` 的 preLaunchTask 会自动执行构建（见 `tasks.json` 的 build all），无需再手动跑 build 或 dev。
