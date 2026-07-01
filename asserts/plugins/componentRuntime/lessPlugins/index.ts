import { createTransformVh } from './transformVh'

const lessPlugin = function () {
  return {
    install(less, pluginManager) {
      pluginManager.addPostProcessor({
        process(css) {
          const appConfig = (window as any).__taroAppConfig
          const transform = createTransformVh(appConfig, { tabbarHeight: 50, baseHeight: 896 })
          return transform(css)
        },
      })
    },
  }
}

export default [lessPlugin]
