/**
 * 出码「项目模式」：在 toCode 的 results 基础上，生成可单独运行的 HTML + Vite 项目。
 * - 产出 index.html（含 React/Antd 等 CDN 引用与 import map，以及 type=module 的构建脚本）
 * - 产出 vite.config.ts（plugin-react、less，react 等 external）
 * - 产出入口 src/main.tsx（ReactDOM 挂载）
 * - 原出码结果放入 src/ 下（如 src/pages/...）
 */

/**
 * 在 results 树中找第一个 .tsx 文件，返回相对于 src 的导入路径（无后缀）
 * @param {Array} items - results 或 children
 * @param {string} prefix - 当前路径前缀，如 'pages'
 * @returns {string|null} 如 './pages/index' 或 null
 */
function findFirstTsxPath(items, prefix = '') {
  if (!Array.isArray(items)) return null
  for (const item of items) {
    const name = item && item.name
    const type = item && item.type
    if (!name) continue
    const segment = prefix ? `${prefix}/${name}` : name
    if (type === 'file' && /\.tsx?$/.test(name)) {
      return './' + segment.replace(/\.(tsx?|jsx?)$/, '')
    }
    if (type === 'folder' && Array.isArray(item.children)) {
      const found = findFirstTsxPath(item.children, segment)
      if (found) return found
    }
  }
  return null
}

/**
 * 解析入口：若 pages 同级存在 index.tsx，优先用 './index'，否则用第一个 .tsx 路径
 * 这样 main.tsx 始终从根 index 进入，根 index 再 re-export 各 page
 * @param {Array} items - results（顶层，与 pages 同级）
 * @returns {string} 如 './index' 或 './pages/xxx/index'
 */
function findEntryTsxPath(items) {
  if (!Array.isArray(items)) return './pages/index'
  const rootIndex = items.find(
    (item) => item && item.type === 'file' && item.name && /^index\.tsx?$/i.test(item.name)
  )
  if (rootIndex) return './index'
  return findFirstTsxPath(items) || './pages/index'
}

/**
 * 生成项目模式下的 index.html 内容
 * - 静态资源版本与 webviewPanel/index.html 对齐（React 18.2.0、dayjs 1.11.x、antd 5.22.x）
 * - 使用 import map 的 ESM CDN，主脚本 type=module 指向构建产物
 */
function getIndexHtmlContent() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MyBricks 出码项目</title>
  <!-- 与 webviewPanel 一致：React 18.2 / react-dom 18.2 / dayjs 1.11 / antd 5.22，此处为 ESM 形式供 type=module 使用 -->
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18.2.0",
      "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
      "react-dom": "https://esm.sh/react-dom@18.2.0",
      "react/jsx-runtime": "https://esm.sh/react@18.2.0/jsx-runtime",
      "dayjs": "https://esm.sh/dayjs@1.11.13",
      "antd": "https://esm.sh/antd@5.22.7",
      "@ant-design/icons": "https://esm.sh/@ant-design/icons@5"
    }
  }
  </script>
</head>
<body>
  <div id="root"></div>
  <!-- 开发模式：指向源码，npm run dev 时 Vite 直接编译；npm run build 后会在 dist/ 生成带正确 script 的 index.html -->
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`
}

/**
 * 生成 Vite 配置：plugin-react、less，入口 src/main.tsx
 */
function getViteConfigContent() {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/main.tsx',
      output: {
        entryFileNames: 'main.js',
        format: 'es',
      },
    },
    target: 'es2020',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
})
`
}

/**
 * 生成 tsconfig.json（供 Vite + TypeScript 使用，JSX 与 vite 的 jsxRuntime: 'automatic' 一致）
 */
function getTsconfigContent() {
  return JSON.stringify(
    {
      "compilerOptions": {
        "target": "ES2020",
        "useDefineForClassFields": true,
        "lib": ["ES2020", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "react-jsx",
        "strict": true,
        "noUnusedLocals": false,
        "noUnusedParameters": false,
        "noFallthroughCasesInSwitch": true
      },
      "include": ["src"]
    },
    null,
    2
  )
}

/**
 * 生成 package.json（含 vite、@vitejs/plugin-react、less、react、@types 等）
 */
function getPackageJsonContent() {
  return JSON.stringify(
    {
      name: 'mybricks-output',
      private: true,
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      },
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        '@vitejs/plugin-react': '^4.2.1',
        less: '^4.2.0',
        typescript: '^5.3.0',
        vite: '^5.0.0',
      },
      dependencies: {
        antd: '^5.21.0',
        'dayjs': '^1.11.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        '@ant-design/icons': '^5.0.0',
      },
    },
    null,
    2
  )
}

/**
 * 生成项目 README
 */
function getReadmeContent() {
  return `# MyBricks 出码项目

由 MyBricks IDE 项目模式导出的 Vite + React + TypeScript 项目。

## 开发

\`\`\`bash
npm install
npm run dev
\`\`\`

## 构建

\`\`\`bash
npm run build
\`\`\`

产物输出到 \`dist/\`。

## 预览构建结果

\`\`\`bash
npm run preview
\`\`\`
`
}

/**
 * 生成基础 reset.css
 */
function getResetCssContent() {
  return `/* reset.css - 基础样式重置 */
*, *::before, *::after {
  box-sizing: border-box;
}

* {
  margin: 0;
  padding: 0;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  line-height: 1.5;
}

img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}

input, button, textarea, select {
  font: inherit;
}
`
}

/**
 * 生成入口 src/main.tsx：ReactDOM 挂载，导入首屏组件
 * @param {string} entryModulePath - 如 './pages/index'
 */
function getMainTsxContent(entryModulePath) {
  const path = entryModulePath || './pages/index'
  return `import './reset.css'
import { createRoot } from 'react-dom/client'
import App from '${path}'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(<App />)
}
`
}

/**
 * 将 toCode 的 results 包装为项目模式输出结构（样式由 toCode 侧处理，此处不做模块化转换）
 * @param {Array<{ name: string, type: string, content?: string, children?: Array }>} results - toCode 返回的树
 * @returns {Array} 可交给 writeWorkspaceFiles 的 results（含 index.html、vite.config.ts、package.json、src/main.tsx、src/ 下原内容）
 */
function wrapResultsAsProject(results) {
  const entryPath = findEntryTsxPath(results)

  const srcChildren = [
    { name: 'reset.css', type: 'file', content: getResetCssContent() },
    {
      name: 'main.tsx',
      type: 'file',
      content: getMainTsxContent(entryPath),
    },
    ...results,
  ]

  return [
    { name: 'index.html', type: 'file', content: getIndexHtmlContent() },
    { name: 'README.md', type: 'file', content: getReadmeContent() },
    { name: 'vite.config.ts', type: 'file', content: getViteConfigContent() },
    { name: 'tsconfig.json', type: 'file', content: getTsconfigContent() },
    { name: 'package.json', type: 'file', content: getPackageJsonContent() },
    {
      name: 'src',
      type: 'folder',
      children: srcChildren,
    },
  ]
}

module.exports = {
  findFirstTsxPath,
  findEntryTsxPath,
  wrapResultsAsProject,
  getIndexHtmlContent,
  getReadmeContent,
  getViteConfigContent,
  getTsconfigContent,
  getPackageJsonContent,
  getMainTsxContent,
}
