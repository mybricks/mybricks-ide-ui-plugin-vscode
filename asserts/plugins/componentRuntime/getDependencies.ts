// ------ taro ------
import * as NutuiIcons from '@nutui/icons-react-taro'
import * as TaroRuntime from '@tarojs/runtime'
import * as TaroComponentsReactOriginal from '@tarojs/components'
import * as TaroDistComponents from '@tarojs/components/dist/components'
import * as TaroFrameworkReact from '@tarojs/plugin-framework-react/dist/runtime'
import * as TaroRouter from '@tarojs/router'
import * as ReactDOMClient from 'react-dom/client'
import * as TaroShared from '@tarojs/shared'
import TaroJsTaroLibs from './availableLibraries/taro'
import TaroJsComponentsLibs from './availableLibraries/taroComponents'
import NutuiIconsReactTaroLibs from './availableLibraries/nutuiIcons'

import * as Taro from '@tarojs/taro'
import { Element } from './babelPlugins/runtime'

const TaroComponentsReactDescriptors = Object.getOwnPropertyDescriptors(TaroComponentsReactOriginal)
// 扩展组件
TaroComponentsReactDescriptors.MyBricksElement = {
  configurable: false,
  enumerable: true,
  get() {
    return Element
  }
}
const TaroComponentsReact = Object.defineProperties({}, TaroComponentsReactDescriptors)

const getDependencies = (params) => {
  return {
    '@tarojs/components': {
      version: '4.2.0',
      module: TaroComponentsReact,
      ...TaroJsComponentsLibs
    },
    '@tarojs/taro': {
      version: '4.2.0',
      module: Taro,
      ...TaroJsTaroLibs
    },
    '@nutui/icons-react-taro': {
      version: '3.0.2-cpp.3.beta.9',
      module: NutuiIcons,
      ...NutuiIconsReactTaroLibs
    },
    '@tarojs/runtime': {
      version: '4.2.0',
      readme: '',
      module: TaroRuntime
    },
    '@tarojs/components/dist/components': {
      version: '4.2.0',
      readme: '',
      module: TaroDistComponents
    },
    '@tarojs/plugin-framework-react/dist/runtime': {
      version: '4.2.0',
      readme: '',
      module: TaroFrameworkReact
    },
    '@tarojs/router': {
      version: '4.2.0',
      readme: '',
      module: TaroRouter
    },
    'react-dom/client': {
      version: '18.3.1',
      readme: '',
      module: ReactDOMClient
    },
    '@tarojs/shared': {
      version: '4.2.0',
      readme: '',
      module: TaroShared
    },
  }
}

export default getDependencies
