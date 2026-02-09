/**
 * MyBricks.ai 设计器配置
 * 配置小程序组件库、存储、页面加载等核心功能
 */
import { createAIPlugin, installAIService } from './ai/mcp'

const vsCodeMessage = (window as any).webViewMessageApi

/**
 * 生成设计器配置
 * MCP 不默认加载（不阻塞读取 setting），仅安装 AI Service 供插件使用；是否启用由 useMCP 监听 setting 后设置。
 */
async function config({ designerRef }) {
  // 仅安装 AI Service，不预读 MCP 开关，避免 MCP 服务未开启时阻塞设计器加载
  installAIService()

  // 读取低码项目内容（直接是 dump() 返回的 JSON）
  const fileResult = await vsCodeMessage.call('getFileContent')
  const fileContent = fileResult?.content !== undefined ? fileResult.content : fileResult

  // tabbar
  ;(window as any).tabbarModel.initFromFileContent(fileContent)

  return {
    //type: 'mpa', // 多页应用模式
    plugins: [
      // createAIPlugin(),
      //servicePlugin(), // HTTP 接口连接器
    ],

    // 初始化数据：直接传递 dump() 返回的 JSON
    value: fileContent || undefined,

    // 组件库添加器（预留）
    comLibAdder() {},

    // 组件库加载器
    comLibLoader(desc) {
      return new Promise((resolve, reject) => {
        resolve([
          'https://assets.mybricks.world/comlibs/mybricks.ai-comlib-pc/1.0.42/2026-02-09_17-29-59/edit.js',
          'https://p66-ec.becukwai.com/udata/pkg/eshop/fangzhou/mybricks.pc-normal-lite/1.0.6/edit.js',
        ])
      })
    },

    pageContentLoader() {
      return vsCodeMessage.call('getFileContent').then((fileResult: { content?: unknown }) => {
        console.log('>>> fileResult:', fileResult)
        const content = fileResult?.content !== undefined ? fileResult.content : fileResult
        console.log('>>> content:', content)
        // 空值时返回默认对象，防止下游报错
        return content ?? '{}'
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
    toplView: {
      title: '交互',
      cards: {
        main: {
          title: '页面',
          ioEditable: true, // 可编辑输入输出
        },
      },
      vars: {}, // 变量配置
      fx: {}, // 函数配置
      useStrict: false, // 非严格模式
    },

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

export { config }
