import { createTransformVh } from './transformVh'

const lessPlugin = function () {
  return {
    install(less, pluginManager) {
      pluginManager.addPostProcessor({
        process(css) {
          const appConfig = (window as any).__taroAppConfig
          const transform = createTransformVh(appConfig, { offset: '50px', only100: true })
          return transform(css)
        },
      })
    },
  }
}

export default [lessPlugin]
