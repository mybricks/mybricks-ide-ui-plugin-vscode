import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const DEFINE_CONFIG = {
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  'DEPRECATED_ADAPTER_COMPONENT': JSON.stringify(false),
  'process.env.TARO_VERSION': JSON.stringify('4.1.11'),
  'process.env.TARO_ENV': JSON.stringify('h5'),
  'process.env.FRAMEWORK': JSON.stringify('react'),
  'process.env.TARO_PLATFORM': JSON.stringify('web'),
  'process.env.SUPPORT_TARO_POLYFILL': JSON.stringify('disabled'),
  'process.env.SUPPORT_DINGTALK_NAVIGATE': JSON.stringify('disabled'),
}

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic', // 使用经典的 React.createElement
    })
  ],

  optimizeDeps: {
    esbuildOptions: {
      define: DEFINE_CONFIG,
    },
  },
  
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
          'react-dom': 'ReactDOM',
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
      '@mybricks/plugin-ai': path.resolve(__dirname, '../plugin-ai/dist/index.js'),
      
      // -- taro polyfill --
      '@tarojs/taro$': path.resolve(__dirname, './polyfill/taro/h5.ts'),
      '@tarojs/plugin-framework-react': '@mybricks/tarojs-plugin-framework-react',
      '@tarojs/router': '@mybricks/tarojs-router',
      '@tarojs/runtime': '@mybricks/tarojs-runtime',
      '@tarojs/taro-h5': '@mybricks/tarojs-taro-h5',
      '@tarojs/components$': '@mybricks/tarojs-components/lib/react',
      '@tarojs/components': '@mybricks/tarojs-components',
    },
    // 优先 .ts/.tsx，使 code-next 内部相对引用也走 TS 源码
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.mts', '.cjs', '.jsx', '.json'],
  },
  
  // 定义全局变量
  define: DEFINE_CONFIG,
})
