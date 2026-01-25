/**
 * MyBricks.ai 设计器配置
 * 配置小程序组件库、存储、页面加载等核心功能
 */
const { message } = (window as any).antd


const vsCodeMessage = (window as any).webViewMessageApi

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
      return new Promise((resolve, reject) => {
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
