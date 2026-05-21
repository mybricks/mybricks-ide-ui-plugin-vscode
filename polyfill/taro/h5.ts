
export * from '@tarojs/plugin-framework-react/dist/runtime'
export * from '@tarojs/plugin-platform-h5/dist/runtime/apis/index.js'

import * as FrameworkReact from '@tarojs/plugin-framework-react/dist/runtime'
import * as PlatformH5 from '@tarojs/plugin-platform-h5/dist/runtime/apis/index.js'

export default { ...FrameworkReact, ...PlatformH5 }