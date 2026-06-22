// ------ taro ------
import babelPlugins from './babelPlugins'
import getDependencies from './getDependencies'
import lessPlugins from './lessPlugins'
// [TODO] 临时，目前倒进来后字体没有被隔离
import '@tarojs/components/dist/taro-components/taro-components.css'

export default {
  babelPlugins,
  lessPlugins,
  getDependencies,
  entryFile: 'app.config.ts',
  canvas: {
    width: 414,
    height: 896
  }
}