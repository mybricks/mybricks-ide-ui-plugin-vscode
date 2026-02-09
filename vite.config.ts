import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic', // 使用经典的 React.createElement
    })
  ],
  
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  },
  
  // 构建配置
  build: {
    outDir: 'out/webview',
    emptyOutDir: true,
    sourcemap: true,
    
    rollupOptions: {
      input: path.resolve(__dirname, 'asserts/index.tsx'),
      
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]',
        format: 'iife',
        name: 'MyBricksApp',
        globals: {
          'react': 'React',
          'react-dom/client': 'ReactDOM',
          'antd': 'antd',
          '@ant-design/icons': 'icons',
        },
      },
      
      // 外部化 CDN 依赖
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'antd',
        'dayjs',
        '@ant-design/icons',
      ],
    },
    
    minify: 'esbuild',
    target: 'es2020',
    commonjsOptions: {
      defaultIsModuleExports: true,
      transformMixedEsModules: true,
    },
  },
  
  // 开发服务器配置（用于独立调试）
  server: {
    port: 5173,
    open: false,
  },
  
  // 解析配置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'asserts'),
      // 指向 TS 源码，避免打包到 CJS 的 .js（无 default 导出互操作）
      '@mybricks/to-target-code': path.resolve(__dirname, '../render-web/packages/code-next/src/toTargetCode/index.ts'),
    },
    // 优先 .ts/.tsx，使 code-next 内部相对引用也走 TS 源码
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.mts', '.cjs', '.jsx', '.json'],
  },
  
  // 定义全局变量
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
})
