import { createTransformVh } from './transformVh'

/**
 * 替换 page/:root/html/body 选择器为 div[data-zone-type="page"]
 */
const transformPage = function (css: string) {
  const selectors = ['page', ':root', 'html', 'body']
  const targetSelector = 'div[data-zone-type="page"]'

  return selectors.reduce((result, selector) => {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const reg = new RegExp(`(^|[\\s>+~,])${escapedSelector}(?=\\s*[{,>+~.#[:]|$)`, 'gm')
    return result.replace(reg, (_, prefix) => `${prefix}${targetSelector}`)
  }, css)
}

const lessPlugin = function () {
  return {
    install(less, pluginManager) {
      pluginManager.addPostProcessor({
        process(css, extra) {
          let newCss = transformPage(css)
          const appConfig = (window as any).__taroAppConfig
          const transform = createTransformVh(appConfig, { tabbarHeight: 50, baseHeight: 896 })
          return transform(newCss)
        },
      })
    },
  }
}

export default [lessPlugin]
