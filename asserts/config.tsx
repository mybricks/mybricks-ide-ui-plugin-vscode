/**
 * MyBricks.ai 设计器配置
 * 配置小程序组件库、存储、页面加载等核心功能
 */
declare const React: any

const { message } = (window as any).antd


const vsCodeMessage = (window as any).webViewMessageApi

/**
 * AI Service API 类型定义
 */
interface AiServiceAPI {
  global: {
    title: string
    api: {
      getAllPageInfo: () => { pageAry: any[] }[]
      getAllComDefPrompts: () => string
      getComEditorPrompts: (ns: string) => string
    }
  }
  page: {
    title: string
    params: string[]
    api: {
      updatePage: (...params: any) => void
      getPageDSLPrompts: (...params: any) => string
      getPageContainerPrompts: (...params: any) => string
      clearPageContent: (pageId: string) => void
      getOutlineInfo: (...params: any) => any
      createCanvas: () => { id: string; title: string }
      createPage: (id: string, title: string, config?: any) => { id: string; onProgress: Function }
      getPageOnProcess: (...params: any) => any
    }
  }
  uiCom: {
    title: string
    api: {
      updateCom: (...params: any) => void
      getComPrompts: (...params: any) => string
      getComDSLPrompts: (...params: any) => string
      /** @deprecated 废弃 */
      getComEditorPrompts: (...params: any) => string
      getOutlineInfo: (...params: any) => any
      getComOnProcess: (...params: any) => any
    }
  }
  diagram: {
    title: string
    api: {
      createDiagram: (...args: any) => { id: string; title: string }
      updateDiagram: (...args: any) => void
      getDiagramInfo: (...args: any) => any
      getDiagramInfoByVarId: (...args: any) => any
      getDiagramInfoByListenerInfo: (...args: any) => any
    }
  }
  logicCom: {
    title: string
    api: {
      getOutlineInfo: (...params: any) => any
      updateCom: (...params: any) => any
    }
  }
}

/**
 * AI Service Focus 参数类型定义
 */
type AiServiceFocusParams = {
  onProgress?: (status: 'start' | 'ing' | 'complete') => void
  /** 区域才会有 */
  focusArea?: {
    selector: string
    title: string
  }
  comId?: string
  pageId?: string
  title: string
  /** 类型，组件、页面，或自定义类型 */
  type: 'page' | 'uiCom' | 'section' | 'logicCom' | string
  vibeCoding?: boolean
}

/**
 * MyBricks AI Service 全局对象类型
 */
interface MyBricksAIService {
  api: AiServiceAPI | null
  focus: AiServiceFocusParams | null | undefined
  isReady: () => boolean
  ready: () => Promise<MyBricksAIService>
}

// 提前初始化全局变量，支持异步等待
let resolveReady: ((value: any) => void) | null = null
const readyPromise = new Promise((resolve) => {
  resolveReady = resolve
})

if (typeof window !== 'undefined' && !(window as any).__mybricksAIService) {
  ;(window as any).__mybricksAIService = {
    api: null,
    focus: null,
    // 判断是否已初始化
    isReady: () => !!(window as any).__mybricksAIService?.api,
    // 异步等待初始化完成
    ready: () => {
      const service = (window as any).__mybricksAIService as MyBricksAIService
      if (service && service.api) {
        return Promise.resolve(service)
      }
      return readyPromise
    },
  } as MyBricksAIService
}

/**
 * 创建简化的 AI 插件配置
 * 只关注 aiService.init 部分，用于获取 api 和 focus 信息
 */
function createAIPlugin() {
  return {
    name: '@mybricks/plugins/ai',
    title: '智能助手',
    author: 'MyBricks',
    version: '1.0.0',
    description: 'ai for MyBricks',
    contributes: {
      aiService: {
        init(api: AiServiceAPI) {
          // 更新全局变量
          const service = (window as any).__mybricksAIService as MyBricksAIService
          if (service) {
            service.api = api
            service.focus = null
          }

          console.log('[AI Plugin - init] API initialized', api)

          // 标记为已就绪（如果 Promise 还在等待）
          if (resolveReady) {
            resolveReady(service)
            resolveReady = null
          }

          // 返回 focus 方法，用于更新聚焦信息
          return {
            focus(params: AiServiceFocusParams | null | undefined) {
              const currentFocus = !params ? undefined : params
              const service = (window as any).__mybricksAIService as MyBricksAIService
              if (service) {
                service.focus = currentFocus
              }
              console.log('[AI Plugin - focus]', currentFocus)
            },
            // 其他方法占位
            request() {},
            registerAgent() {},
            fileFormat() {},
          }
        },
      },
      // 其他 view 渲染占位
      aiView: {
        render() {
          return React.createElement('div', { style: { padding: '20px' } }, 'AI View Placeholder')
        },
        display() {},
        hide() {},
      },
      aiStartView: {
        render() {
          return React.createElement('div', { style: { padding: '20px' } }, 'AI Start View Placeholder')
        },
      },
    },
  }
}

/**
 * 生成设计器配置
 */
async function config({ designerRef }) {
  // 读取低码项目内容
  const fileContent = await vsCodeMessage.call('getFileContent')

  // tabbar
  ;(window as any).tabbarModel.initFromFileContent(fileContent)

  return {
    //type: 'mpa', // 多页应用模式
    plugins: [
      createAIPlugin(), // AI 插件
      //servicePlugin(), // HTTP 接口连接器
    ],

    // 组件库添加器（预留）
    comLibAdder() {},

    // 组件库加载器
    comLibLoader(desc) {
      return new Promise((resolve, reject) => {
        resolve([
          'https://assets.mybricks.world/comlibs/mybricks.normal-pc.antd5/1.0.80/2026-01-13_11-08-11/edit.js',
        ])
      })
    },

    // 保存
    async save() {
      try {
        if (!designerRef.current) {
          message.error('设计器未初始化')
          return
        }

        const dumped = designerRef.current.dump(true, true)

        if (!dumped) {
          message.error('无法获取设计器数据')
          console.error('dump() 返回 undefined')
          return
        }

        const { json: dumpedJson, reset } = dumped

        if (!dumpedJson) {
          message.error('导出数据为空')
          console.error('dumped.json 为空:', dumped)
          return
        }

        console.log('dumpedJson', dumpedJson)

        // 提取导出数据
        const {
          pageAry, // 页面列表
          projectContent, // 项目内容
          openedPageAry, // 打开的页面
          updatedPageAry, // 更新的页面
          deletedPageAry, // 删除的页面
        } = dumpedJson

        let saveContent = fileContent

        // 初始化保存结构
        if (!saveContent) {
          saveContent = {
            project: { projectContent },
            pages: [],
            extra: {},
          }
        } else {
          saveContent.project.projectContent = projectContent
        }

        // 更新项目信息
        saveContent.project.pageAry = pageAry
        saveContent.project.openedPageAry = openedPageAry
        saveContent.project.deletedPageAry = deletedPageAry

        // 更新页面内容
        if (updatedPageAry) {
          updatedPageAry.forEach((page) => {
            const idx = saveContent.pages.findIndex((p) => p.id === page.id)
            if (idx > -1) {
              saveContent.pages[idx].content = page.content
            } else {
              saveContent.pages.push(page)
            }
          })
        }

        if (!saveContent.extra) saveContent.extra = {}
        // tabbar
        const tabbar = (window as any).__tabbar__.get()
        saveContent.extra.tabbar = tabbar

        // 通知 VS Code 保存文件
        await vsCodeMessage.call('saveFileContent', saveContent)

        message.info(`保存完成`)
      } catch (error) {
        console.error('❌ 保存失败:', error)
      }
    },

    pageContentLoader(pageId) {//加载页面内容
      return new Promise<void>((resolve, reject) => {
        resolve()
      })
    },

    // 画布配置
    geoView: {
      toolbarContainer: '#toolbarBtns', // 工具栏容器
      scenes: {
        adder: [
          {
            type: 'normal',
            title: '页面',
            widthAuto: true,
            configs: [//自定义编辑项
              {
                title: '唯一标识',
                type: 'text',
                value: {
                  get({sceneId}) {
                    //return context._useRem;
                  },
                  set({sceneId}, v: boolean) {
                    //context._useRem = v;
                  },
                },
              },
            ],
            inputs: [
              {
                id: 'test',
                title: '自定义',
                schema: {
                  type: 'string'
                }
              }
            ],
            events: [
              {
                id: 'onLoad',
                title: '页面加载',
                schema: {
                  type: 'any'
                }
              },
              {
                id: "onShow",
                title: "页面显示",
                schema: {
                  type: "any",
                },
              },
              {
                id: "onHide",
                title: "页面隐藏",
                schema: {
                  type: "any",
                },
              },
            ]
          },
        ],
      },
      theme: {
        css: [
          'https://my.mybricks.world/mybricks-app-mpsite/public/brickd-mobile/0.0.53/index.css',
          'https://my.mybricks.world/mybricks-app-mpsite/public/edit-reset.css',
        ],
      },
    },

    // // 交互编排视图
    // toplView: {
    //   title: '交互',
    //   cards: {
    //     main: {
    //       title: '页面',
    //       ioEditable: true, // 可编辑输入输出
    //     },
    //   },
    //   vars: {}, // 变量配置
    //   fx: {}, // 函数配置
    //   useStrict: false, // 非严格模式
    // },

    // 组件运行环境配置
    com: {
      env: {
        // 国际化
        i18n(title) {
          return title
        },
        // 调用连接器（HTTP 请求等）
        callConnector(connector, params) {
          const plugin = designerRef.current?.getPlugin(
            connector.connectorName || '@mybricks/plugins/service',
          )

          if (plugin) {
            return plugin.callConnector(connector, params)
          } else {
            return Promise.reject('错误的连接器类型.')
          }
        },
      },
    },

    // 编辑器配置面板
    editView: {
      items({}, cate0, cate1, cate2) {
        cate0.title = `项目`
        cate0.items = [
          {
            items: [
              {
                title: '项目的配置项例子',
                type: 'switch',
                value: {
                  get(context) {
                    return context._useRem
                  },
                  set(context, v: boolean) {
                    context._useRem = v
                  },
                },
              },
            ],
          },
        ]
      },
    },
  }
}

// 挂载到全局供 app.tsx 使用
;(window as any).config = config
