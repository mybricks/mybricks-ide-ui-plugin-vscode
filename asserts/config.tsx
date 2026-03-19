/**
 * MyBricks.ai 设计器配置
 * 配置小程序组件库、存储、页面加载等核心功能
 */
import React from 'react'
import { createAIPlugin, installAIService } from './ai/mcp'
import ExportCode from './components/export-code'
import TokenConfig from './components/token-config'
import FilePath from './components/file-path'
import { loadManifest } from './manifestLoader'

import getAiPlugin from './plugins/get-ai-plugin'

const vsCodeMessage = (window as any).webViewMessageApi

/**
 * 生成设计器配置
 * MCP 不默认加载（不阻塞读取 setting），仅安装 AI Service 供插件使用；是否启用由 useMCP 监听 setting 后设置。
 */
async function config({ designerRef, aiChannel }: { designerRef: React.MutableRefObject<any>, aiChannel: 'infra' | 'mybricks' }) {
  installAIService()

  const fileResult = await vsCodeMessage.call('getFileContent')
  const fileContent = fileResult?.content !== undefined ? fileResult.content : fileResult

  // tabbar
  ;(window as any).tabbarModel.initFromFileContent(fileContent)

  return {
    desnMode: 'vibeCoding',
    //type: 'mpa', // 多页应用模式
    plugins: [
      // createAIPlugin(),
      getAiPlugin({
        key: fileResult?.path ?? `ai-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        useInfra: aiChannel === 'infra',
        getToken: () => vsCodeMessage.call('getAIToken').then((t: string) => t ?? '').catch(() => ''),
        onDownload: (params) =>
          vsCodeMessage.call('downloadFile', { name: params.name, content: params.content }),
      }),
      //servicePlugin(), // HTTP 接口连接器
    ],

    // 初始化数据：直接传递 dump() 返回的 JSON
    value: fileContent || undefined,

    // 组件库添加器（预留）
    comLibAdder() {},

    // 组件库加载器：从 manifest 动态获取 aiComLib.url
    comLibLoader(desc) {
      return loadManifest().then((manifest) => {
        const aiComLibUrl = manifest?.aiComLib?.url
        if (!aiComLibUrl) {
          console.warn('[comLibLoader] manifest.aiComLib.url 为空，跳过组件库加载')
          return []
        }
        console.log('>>> aiComLibUrl:', aiComLibUrl)
        return [aiComLibUrl]
      }).catch((err) => {
        console.error('[comLibLoader] 获取 manifest 失败:', err)
        return []
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
      // toolbarContainer: '#toolbarBtns', // 工具栏容器
      scenes: {
        adder: [
          // {
          //   type: 'normal',
          //   title: '页面',
          //   widthAuto: true,
          //   // configs: [//自定义编辑项
          //   //   {
          //   //     title: '唯一标识',
          //   //     type: 'text',
          //   //     value: {
          //   //       get({sceneId}) {
          //   //         //return context._useRem;
          //   //       },
          //   //       set({sceneId}, v: boolean) {
          //   //         //context._useRem = v;
          //   //       },
          //   //     },
          //   //   },
              
          //   // ],
          //   configs: [//自定义编辑项
          //     function(context) {
          //       const sceneId = context.sceneId
          //       return <ExportCode designerRef={designerRef} sceneId={sceneId} simpleMode={true} />
          //     }
          //   ],
          //   inputs: [
          //     {
          //       id: 'test',
          //       title: '自定义',
          //       schema: {
          //         type: 'string'
          //       }
          //     }
          //   ],
          //   events: [
          //     {
          //       id: 'onLoad',
          //       title: '页面加载',
          //       schema: {
          //         type: 'any'
          //       }
          //     },
          //     {
          //       id: "onShow",
          //       title: "页面显示",
          //       schema: {
          //         type: "any",
          //       },
          //     },
          //     {
          //       id: "onHide",
          //       title: "页面隐藏",
          //       schema: {
          //         type: "any",
          //       },
          //     },
          //   ]
          // },
          {
            type: 'normal',
            title: 'AI页面',
            template: {
              namespace: 'mybricks.basic-comlib.ai-mix',
              deletable: false,
              asRoot: true,
            },
            // width: 300,
            // height: 200,
            // widthAuto: true,
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
            ]
          },
        ],
      },
      nav: {
        float: true,
        comShortcuts: [
          {
            title: 'AI组件',
            namespace: 'mybricks.basic-comlib.ai-mix'
          }
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
            title: '文件路径',
            type: 'editorRender',
            options: {
              render: () => <FilePath />
            }
          },
          ...(aiChannel === 'mybricks' ? [{
            title: 'AI请求凭证',
            type: 'editorRender',
            options: {
              render: () => <TokenConfig />
            }
          }] : [])
        ]
      },
    },
  }
}

export { config }
