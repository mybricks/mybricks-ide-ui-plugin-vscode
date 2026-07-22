// ------ taro ------
import babelPlugins from './babelPlugins'
import getDependencies from './getDependencies'
import lessPlugins from './lessPlugins'
// [TODO] 临时，目前倒进来后字体没有被隔离
import '@tarojs/components/dist/taro-components/taro-components.css'

// 替换 mybricks 提示词
import mybricksPrompt from './availableLibraries/mybricks/usagenext.md?raw'

let version = 7 //重新渲染

export default {
  modules: {
    frontend: {
      type: 'frontend',
      pattern: /\.(?:tsx|ts|js)$/i,
      canvas: {
        width: 414,
        height: 896
      },
      getDependencies,
      entryFile: 'app.config.ts',
      mybricksPrompt
    }
  },
  babelPlugins,
  lessPlugins,
  version,
  eslint: {
    globals: {
      defineAppConfig: 'readonly',
      definePageConfig: 'readonly'
    }
  }
}