const getPageComponentName = (page: string) => {
  return `Page_${page.replace(/[^a-zA-Z0-9]/g, '_')}`
}

const buildAppEntryCode = (appConfig: Taro.AppConfig, ) => {
  const { pages } = appConfig;

  const appMountHandler = appConfig.tabBar?.list?.length > 1 ? 'handleAppMountWithTabbar' : 'handleAppMount'

  return `
  import { MyBricksElement } from '@tarojs/components'
  import { appRef, Routes, Route, logger } from 'mybricks'
  import App from './app'
  ${pages.reduce((pre, page) => {
    return pre + `import ${getPageComponentName(page)} from './${page}'\n`
  }, "")}

  import { EMPTY_OBJ } from '@tarojs/shared'
  import { createRouter, createMemoryHistory, ${appMountHandler}, stacks } from '@tarojs/router'
  import { window, Current } from '@tarojs/runtime'
  import { createReactApp, reactMeta } from '@tarojs/plugin-framework-react/dist/runtime'

  import * as React from 'react'
  import ReactDOM from 'react-dom/client'

  import { findDOMNode, render, unstable_batchedUpdates } from 'react-dom'
  import { defineCustomElementTaroPullToRefreshCore } from '@tarojs/components/dist/components'
  import { resetInteraction } from '@tarojs/taro'

  const appConfig = ${JSON.stringify(appConfig)}

  let Render = () => {
    const _debugTarget = process.env.DEBUG_TARGET

    React.useLayoutEffect(() => {
      // 初始化
      resetInteraction()

      reactMeta.PageContext = EMPTY_OBJ
      reactMeta.destroy()
      reactMeta.destroy = () => {}

      stacks.stacks = []
      stacks.backDelta = 0
      stacks.tabs = {}
      stacks.methodName = ''

      Current.app = null
      Current.router = null
      Current.page = null

      var config = ${JSON.stringify(appConfig)}
      window.__taroAppConfig = config

      config.routes = [
        ${pages.reduce((pre, page) => {
          return pre + `Object.assign({
            path: '${page}',
            load: function(context, params) {
              const page = import("./${page}")
              return [page, context, params]
            }
          }, {}),`
        }, "")}
      ]
      Object.assign(ReactDOM, { findDOMNode, render, unstable_batchedUpdates })
      defineCustomElementTaroPullToRefreshCore()

      var inst = createReactApp(App, React, ReactDOM, config)
      var history = createMemoryHistory(({ initialEntries: [_debugTarget.pageIndex] }))
      ${appMountHandler}(config, history)
      createRouter(history, inst, config, React)
    }, [])

    return (
      <div
        style={{
          ..._debugTarget?.rootStyle,
          '--taro-tabbar-height': '50px'
        }}
      >
        <div
          id="${appConfig.appId}Container"
          style={{
            ..._debugTarget?.style,
            height: '896px',
            overflow: 'hidden'
          }}
        >
          <div id="${appConfig.appId}"></div>
        </div>
      </div>
    )
  }

  if (process.env.MODE === 'design') {
    Render = () => {
      return (
        <App>
          <Routes>
            ${pages.reduce((pre, page) => {
              if (appConfig.tabBar?.list?.length > 1) {
                const tabBarItem = appConfig.tabBar.list.find((tabBarItem) => tabBarItem.pagePath === page)
                if (tabBarItem) {
                  return pre + `<Route path={'${page}'} element={
                    <MyBricksElement
                      page={'${page}'}
                      appConfig={appConfig}
                    >
                      <${getPageComponentName(page)}/>
                    </MyBricksElement>}/>\n`
                }
              }

              return pre + `<Route path={'${page}'} element={<${getPageComponentName(page)}/>}/>`
            }, "")}
          </Routes>
        </App>
      )
    }
  }

  export default Render
  `
}

export default buildAppEntryCode
