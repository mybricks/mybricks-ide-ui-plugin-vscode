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
          '@babel/standalone': 'Babel',
          '@babel/parser': 'Babel.packages.parser',
          '@babel/traverse': 'Babel.packages.traverse.default',
          '@babel/generator': 'Babel.packages.generator.default',
          '@babel/types': 'Babel.packages.types',
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
        '@babel/standalone',
        '@babel/parser',
        '@babel/traverse',
        '@babel/generator',
        '@babel/types',
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
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'asserts') },
      // -- taro polyfill --
      { find: /^@tarojs\/taro$/, replacement: path.resolve(__dirname, './polyfill/taro/h5.ts') },
      { find: '@tarojs/plugin-framework-react', replacement: '@mybricks/tarojs-plugin-framework-react' },
      { find: '@tarojs/router', replacement: '@mybricks/tarojs-router' },
      { find: '@tarojs/runtime', replacement: '@mybricks/tarojs-runtime' },
      { find: '@tarojs/taro-h5', replacement: '@mybricks/tarojs-taro-h5' },
      { find: /^@tarojs\/components$/, replacement: '@mybricks/tarojs-components/lib/react' },
      { find: '@tarojs/components', replacement: '@mybricks/tarojs-components' },
    ],
    // 优先 .ts/.tsx，使 code-next 内部相对引用也走 TS 源码
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.mts', '.cjs', '.jsx', '.json'],
  },
  
  // 定义全局变量
  define: DEFINE_CONFIG,
})
