/**
 * MyBricks 主应用入口
 */
declare const React: any
declare const ReactDOM: any
declare const MyBricksAPI: any

const { useState, useRef, useMemo, useCallback, useEffect } = React
const rootEl = document.getElementById('root')

const STORAGE_KEY_EXPORT = '--mybricks-export-config-'
type ExportConfig = {
  projectName: string
  exportDir?: string
}

import { AppMyBricksAIService } from './types'


console.log('>>> App MyBricksAPI:', MyBricksAPI)

// MyBricks SPA Designer 引擎
const { SPADesigner } = (window as any).mybricks

// 获取配置函数（由 config.tsx 挂载）
const configFn = (window as any).config

const ANTD_CONFIG = {
  theme: {
    token: {
      colorPrimary: '#fa6400',
    },
  },
}
const {
  ConfigProvider,
  Popover,
  Form,
  Input,
  Button,
  message,
  Space,
  Tooltip,
  Flex,
  Alert,
} = (window as any).antd
const { VerticalAlignBottomOutlined } = (window as any).icons

const vsCodeMessage = (window as any).webViewMessageApi

// 渲染应用
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl)
  root.render(<App />)
}

/**
 * 主应用组件
 */
function App() {
  // 内容变更计数
  const [changed, setChanged] = useState(0)

  // 下载弹出层显隐
  const [exportPopoverVisible, setExportPopoverVisible] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  // 消息提示处理
  const onMessage = useCallback((type, msg, duration = 3) => {
    message.destroy()
    message[type](msg, duration)
  }, [])

  // 设计器实例引用
  const designerRef = useRef(null)

  // MyBricksAPI 实例缓存
  const myBricksAPIRef = useRef(null)

  // 初始化配置
  const [initSuccess, setInitSuccess] = useState(false)
  const config = useRef(null)
  useEffect(() => {
    configFn({
      designerRef,
    }).then((_config) => {
      setInitSuccess(true)
      config.current = _config
    })
  }, [designerRef])

  // 访问 AI Service API 和 Focus 信息
  useEffect(() => {
    if (!initSuccess) return

    ;(async () => {
      const aiService = (window as any).__mybricksAIService as AppMyBricksAIService | undefined
      if (aiService && aiService.ready) {
        const service = await aiService.ready()
        
        // 使用类型化的 API 和 Focus
        if (service.api) {
          // 示例：访问 API
          // service.api.page.api.getAllPageInfo()
          // service.api.uiCom.api.updateCom(...)
        }
        
        if (service.focus) {
          // 示例：访问 Focus 信息
          // const { type, pageId, comId, title } = service.focus
        }
      }
    })()
  }, [initSuccess])

  // 注册前端方法供 MCP 调用
  useEffect(() => {
    if (!initSuccess) return

    const aiService = (window as any).__mybricksAIService as AppMyBricksAIService | undefined

    // 创建统一的 API 代理函数
    const createGlobalApiProxy = async (methodName: string, ...args: any[]) => {
      if (!aiService) {
        throw new Error('AI Service 未初始化')
      }

      const service = await aiService.ready()

      if (!service.api) {
        throw new Error('AI Service API 不可用')
      }

      // 使用缓存的 MyBricksAPI 实例，如果不存在则创建并缓存
      if (!myBricksAPIRef.current) {
        myBricksAPIRef.current = new MyBricksAPI.MyBricksAPI({ api: service.api })
      }

      // 支持点分路径访问，如 "global.api.getAllPageInfo"
      const pathSegments = methodName.split('.')
      let current: any = myBricksAPIRef.current

      for (const segment of pathSegments) {
        if (current == null) {
          throw new Error(`路径 ${methodName} 不存在`)
        }
        current = current[segment]
      }

      if (typeof current !== 'function') {
        throw new Error(`${methodName} 不是一个函数`)
      }

      const result = current(...args)
      return result
    }

    // 注册通用的 API 代理 handler，允许调用任何 global API 方法
    if (vsCodeMessage) {
      vsCodeMessage.registerHandler('callGlobalApi', async (data) => {
        const { methodName, args } = data
        if (!methodName) {
          throw new Error('methodName 必须提供')
        }
        try {
          const result = await createGlobalApiProxy(methodName, ...(args || []))
          return result
        } catch (error) {
          console.error('[App] callGlobalApi handler error:', error)
          throw error
        }
      })

      console.log('[App] Registering getFocusElementInfo handler...')
      // 注册获取当前聚焦元素信息的 handler
      vsCodeMessage.registerHandler('getFocusElementInfo', async () => {
        if (!aiService) {
          return null
        }
        // 返回当前聚焦的元素信息
        const focusInfo = aiService.focus || null
        return focusInfo
      })
 
      
    } else {
      console.error('[App] vsCodeMessage is NOT available')
    }
  }, [initSuccess])

  // 保存
  const save = useCallback((all?) => {
    setChanged(0)
    config.current.save(all)
  }, [])

  // 导出
  const handleExport = useCallback(() => {
    // setExportPopoverVisible(false)
    setExportLoading(true)
    onMessage('loading', '导出中...', 0)
    const configJson = designerRef.current.toJSON({
      withDiagrams: true,
      withIOSchema: true,
    })
    vsCodeMessage
      .call('exportProject', {
        configJson,
      })
      .then((res: { success: boolean; message: string }) => {
        console.log('>>>>>导出结果', res)
        if (res.success) {
          onMessage('success', res.message)
        } else {
          onMessage(
            'error',
            typeof res.message === 'string' ? res.message : '导出失败'
          )
        }
      })
      .finally(() => {
        setExportLoading(false)
      })
  }, [])

  const handleTest = useCallback(async () => {
    const aiService = (window as any).__mybricksAIService as AppMyBricksAIService | undefined
    if (!aiService || !aiService.api) {
      return
    }

    try {
      const pageId = aiService.api.global.api.getAllPageInfo()?.[0]?.id;
      await aiService.api.page.api.updatePage(pageId, [], 'start')
      for (let index = 0; index < mockActions.length; index++) {
        const action = mockActions[index];
        await aiService.api.page.api.updatePage(pageId, [action], 'ing')
      }
      await aiService.api.page.api.updatePage(pageId, [], 'complete')
    } catch (error) {
      console.error('[App] handleTest error:', error)
    }
  }, [])

  return (
    <ConfigProvider {...ANTD_CONFIG}>
      <div className='ide'>
        {/* 顶部工具栏 */}
        <div className='toolbar'>
          <div className={'logo'}>MyBricks</div>
          <div className={'btns'} id={'toolbarBtns'} />
          <Space>
            <button className={'button primary'} onClick={save}>
              {changed ? '*' : ''}保存
            </button>
            <button
              className={'button '}
              disabled={exportLoading}
              onClick={handleExport}
            >
              导出
            </button>
            <button className={'button'} onClick={handleTest}>
              测试生成报错
            </button>
            {/* <Popover
              title='导出应用的源代码'
              open={exportPopoverVisible}
              onOpenChange={setExportPopoverVisible}
              trigger='click'
              placement='bottomRight'
              arrow={false}
              content={
                <ExportContent
                  onExport={handleExport}
                  onClose={() => setExportPopoverVisible(false)}
                />
              }
            >
              <Tooltip title={'导出应用的源代码'}>
                <Button type='text' icon={<VerticalAlignBottomOutlined />} />
              </Tooltip>
            </Popover> */}
          </Space>
        </div>

        {/* 设计器主区域 */}
        <div className={'designer'}>
          {initSuccess && (
            <SPADesigner
              config={config.current}
              ref={designerRef}
              onLoad={(e) => console.log('loaded')}
              onMessage={onMessage}
              onEdit={() => setChanged(changed + 1)}
            />
          )}
        </div>
      </div>
    </ConfigProvider>
  )
}

// function ExportContent(Iprops: {
//   onClose: () => void
//   onExport: (toZip: boolean, values: ExportConfig) => void
// }) {
//   const { onClose, onExport } = Iprops
//   const defaultValues = Object.assign(
//     {
//       projectName: 'my_project',
//     },
//     JSON.parse(localStorage.getItem(STORAGE_KEY_EXPORT) || '{}')
//   ) as ExportConfig

//   const [form] = Form.useForm()
//   const [formValues, setFormValues] = useState(defaultValues)
//   const exportDir = Form.useWatch('exportDir', form)

//   const onSelectDir = () => {
//     vsCodeMessage.call('selectExportDir').then((res) => {
//       if (res?.path) {
//         const dir = res.path
//         form.setFieldValue('exportDir', dir)
//         save('exportDir', dir)
//       }
//     })
//   }

//   const onClearDir = () => {
//     form.setFieldValue('exportDir', '')
//     save('exportDir', '')
//   }

//   const handleExport = useCallback(
//     (toZip: boolean) => {
//       onExport(toZip, formValues)
//     },
//     [onExport, formValues]
//   )

//   const save = useCallback(
//     (key: keyof ExportConfig, value: ExportConfig[keyof ExportConfig]) => {
//       console.log(value)
//       const exportConfig = { ...formValues, [key]: value }
//       setFormValues(exportConfig)
//       localStorage.setItem(STORAGE_KEY_EXPORT, JSON.stringify(exportConfig))
//     },
//     [formValues]
//   )

//   return (
//     <Form
//       className={'export-form'}
//       form={form}
//       layout='vertical'
//       size='small'
//       initialValues={defaultValues}
//     >
//       <Form.Item
//         label='应用名称'
//         name='projectName'
//         rules={[
//           {
//             validator: (_, value: string) =>
//               /^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)
//                 ? Promise.resolve()
//                 : Promise.reject(
//                     new Error('以字母开头，仅支持字母、数字以及下划线')
//                   ),
//           },
//         ]}
//       >
//         <Input
//           placeholder='请输入应用名称'
//           onBlur={() => {
//             form
//               .validateFields(['projectName'])
//               .then((values: ExportConfig) => {
//                 save('projectName', values.projectName)
//               })
//           }}
//         />
//       </Form.Item>
//       <Form.Item label='应用导出目录' name='exportDir' shouldUpdate>
//         {exportDir ? (
//           <div>
//             <span title={exportDir} style={{ marginRight: 8 }}>
//               {exportDir.split(/[\\/]/).pop()}
//             </span>
//             <Button onClick={onClearDir}>重置</Button>
//           </div>
//         ) : (
//           <Button type='primary' onClick={onSelectDir}>
//             配置目录
//           </Button>
//         )}
//       </Form.Item>

//       <Form.Item>
//         <Alert
//           message={
//             <Space direction='vertical' size='small'>
//               <h3 className={'export-alert-txt'}>注意事项</h3>
//               <p className={'export-alert-txt'}>导出当前应用的Taro源代码；</p>
//               <p className={'export-alert-txt'}>
//                 【同步应用】以写文件覆盖的形式直接同步至目标目录下
//               </p>
//               <p className={'export-alert-txt'}>
//                 【导出应用】打包成zip文件导出至目标目录下
//               </p>
//             </Space>
//           }
//           type='warning'
//         />
//       </Form.Item>

//       <Form.Item shouldUpdate style={{ marginBottom: 0 }}>
//         {() => (
//           <Flex gap='small' justify='flex-end'>
//             <Button onClick={onClose}>取消</Button>
//             <Button
//               type='primary'
//               disabled={
//                 !exportDir ||
//                 form.getFieldsError().filter(({ errors }) => errors.length)
//                   .length
//               }
//               onClick={() => handleExport(true)}
//             >
//               导出应用
//             </Button>
//             <Button
//               type='primary'
//               disabled={
//                 !exportDir ||
//                 form.getFieldsError().filter(({ errors }) => errors.length)
//                   .length
//               }
//               onClick={() => handleExport(false)}
//             >
//               同步应用
//             </Button>
//           </Flex>
//         )}
//       </Form.Item>
//     </Form>
//   )
// }


var mockActions = [
    {
        "comId": "_root_",
        "type": "setLayout",
        "target": ":root",
        "params": {
            "height": 3200,
            "width": 1024
        }
    },
    {
        "comId": "_root_",
        "type": "doConfig",
        "target": ":root",
        "params": {
            "path": "root/标题",
            "value": "大学官网"
        }
    },
    {
        "comId": "_root_",
        "type": "doConfig",
        "target": ":root",
        "params": {
            "path": "root/布局",
            "value": {
                "display": "flex",
                "flexDirection": "column",
                "alignItems": "center"
            }
        }
    },
    {
        "comId": "_root_",
        "type": "doConfig",
        "target": ":root",
        "params": {
            "path": "root/样式",
            "style": {
                "backgroundColor": "#F5F7FA",
                "backgroundImage": "none"
            }
        }
    },
    {
        "comId": "_root_",
        "type": "addChild",
        "target": "_rootSlot_",
        "params": {
            "title": "顶部导航",
            "comId": "u_nav01",
            "layout": {
                "width": "100%",
                "height": 64
            },
            "configs": [
                {
                    "path": "常规/布局",
                    "value": {
                        "display": "flex",
                        "flexDirection": "row",
                        "justifyContent": "space-between",
                        "alignItems": "center"
                    }
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "boxShadow": "0 1px 4px rgba(0,0,0,0.08)",
                        "backgroundColor": "#FFFFFF",
                        "backgroundImage": "none"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-container"
        }
    },
    {
        "comId": "u_nav01",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "左侧Logo区",
            "comId": "u_logo1",
            "ignore": true,
            "layout": {
                "width": "fit-content",
                "height": "fit-content",
                "marginLeft": 24
            },
            "configs": [
                {
                    "path": "常规/布局",
                    "value": {
                        "display": "flex",
                        "flexDirection": "row",
                        "alignItems": "center"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-container"
        }
    },
    {
        "comId": "u_logo1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "Logo",
            "comId": "u_img01",
            "layout": {
                "width": 48,
                "height": 48,
                "marginRight": 12
            },
            "configs": [
                {
                    "path": "常规/图片地址",
                    "value": "https://placehold.co/48x48/1677FF/FFFFFF?text=U"
                },
                {
                    "path": "常规/填充模式",
                    "value": "cover"
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.single-image"
        }
    },
    {
        "comId": "u_logo1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "校名容器",
            "comId": "u_snam1",
            "ignore": true,
            "layout": {
                "width": "fit-content",
                "height": "fit-content"
            },
            "configs": [
                {
                    "path": "常规/布局",
                    "value": {
                        "display": "flex",
                        "flexDirection": "column"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-container"
        }
    },
    {
        "comId": "u_snam1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "中文校名",
            "comId": "u_txt01",
            "layout": {
                "width": "fit-content",
                "height": "fit-content"
            },
            "configs": [
                {
                    "path": "常规/内容",
                    "value": "某某大学"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "fontSize": 18,
                        "fontWeight": 600,
                        "color": "#333333"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.text"
        }
    },
    {
        "comId": "u_snam1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "英文校名",
            "comId": "u_txt02",
            "layout": {
                "width": "fit-content",
                "height": "fit-content",
                "marginTop": 2
            },
            "configs": [
                {
                    "path": "常规/内容",
                    "value": "University"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "fontSize": 12,
                        "color": "#666666"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.text"
        }
    },
    {
        "comId": "u_nav01",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "主导航",
            "comId": "u_menu1",
            "layout": {
                "width": "fit-content",
                "height": "fit-content"
            },
            "configs": [
                {
                    "path": "导航菜单/样式",
                    "value": "horizontal"
                },
                {
                    "path": "常规/数据源",
                    "value": [
                        {
                            "defaultActive": true,
                            "key": "home",
                            "menuType": "menu",
                            "title": "首页"
                        },
                        {
                            "defaultActive": false,
                            "key": "about",
                            "menuType": "menu",
                            "title": "学校概况"
                        },
                        {
                            "defaultActive": false,
                            "key": "faculty",
                            "menuType": "menu",
                            "title": "院系专业"
                        },
                        {
                            "defaultActive": false,
                            "key": "admission",
                            "menuType": "menu",
                            "title": "招生就业"
                        },
                        {
                            "defaultActive": false,
                            "key": "research",
                            "menuType": "menu",
                            "title": "科学研究"
                        },
                        {
                            "defaultActive": false,
                            "key": "campus",
                            "menuType": "menu",
                            "title": "校园生活"
                        },
                        {
                            "defaultActive": false,
                            "key": "news",
                            "menuType": "menu",
                            "title": "新闻动态"
                        }
                    ]
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.menu"
        }
    },
    {
        "comId": "u_nav01",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "右侧操作区",
            "comId": "u_rght1",
            "ignore": true,
            "layout": {
                "width": "fit-content",
                "height": "fit-content",
                "marginRight": 24
            },
            "configs": [
                {
                    "path": "常规/布局",
                    "value": {
                        "display": "flex",
                        "flexDirection": "row",
                        "alignItems": "center"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-container"
        }
    },
    {
        "comId": "u_rght1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "搜索图标",
            "comId": "u_ico01",
            "layout": {
                "width": 20,
                "height": "fit-content",
                "marginRight": 16
            },
            "configs": [
                {
                    "path": "常规/选择图标",
                    "value": "SearchOutlined"
                },
                {
                    "path": "样式/默认/颜色",
                    "style": {
                        "color": "#666666"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.icon"
        }
    },
    {
        "comId": "u_rght1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "语言切换",
            "comId": "u_txt03",
            "layout": {
                "width": "fit-content",
                "height": "fit-content",
                "marginRight": 16
            },
            "configs": [
                {
                    "path": "常规/内容",
                    "value": "中 / EN"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "fontSize": 14,
                        "color": "#666666"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.text"
        }
    },
    {
        "comId": "u_rght1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "登录按钮",
            "comId": "u_btn01",
            "layout": {
                "width": "fit-content",
                "height": 32
            },
            "configs": [
                {
                    "path": "按钮/文字标题",
                    "value": "登录"
                },
                {
                    "path": "样式/风格",
                    "value": "primary"
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-button"
        }
    },
    {
        "comId": "_root_",
        "type": "addChild",
        "target": "_rootSlot_",
        "params": {
            "title": "首屏英雄区",
            "comId": "u_hero1",
            "layout": {
                "width": "100%",
                "height": 480
            },
            "configs": [
                {
                    "path": "常规/布局",
                    "value": {
                        "display": "flex",
                        "flexDirection": "column",
                        "justifyContent": "center",
                        "alignItems": "center"
                    }
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "backgroundColor": "transparent",
                        "backgroundImage": "linear-gradient(135deg, #1677FF 0%, #597EF7 50%, #2F54EB 100%)"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-container"
        }
    },
    {
        "comId": "u_hero1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "主标题",
            "comId": "u_htxt1",
            "layout": {
                "width": "fit-content",
                "height": "fit-content"
            },
            "configs": [
                {
                    "path": "常规/内容",
                    "value": "笃学力行 创新致远"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "fontSize": 48,
                        "fontWeight": 700,
                        "color": "#FFFFFF",
                        "lineHeight": 1.2
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.text"
        }
    },
    {
        "comId": "u_hero1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "副标题",
            "comId": "u_stxt1",
            "layout": {
                "width": "fit-content",
                "height": "fit-content",
                "marginTop": 16
            },
            "configs": [
                {
                    "path": "常规/内容",
                    "value": "一所具有百年历史的综合性研究型大学"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "fontSize": 18,
                        "color": "rgba(255,255,255,0.9)",
                        "lineHeight": 1.5
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.text"
        }
    },
    {
        "comId": "u_hero1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "按钮组",
            "comId": "u_btng1",
            "ignore": true,
            "layout": {
                "width": "fit-content",
                "height": "fit-content",
                "marginTop": 32
            },
            "configs": [
                {
                    "path": "常规/布局",
                    "value": {
                        "display": "flex",
                        "flexDirection": "row",
                        "alignItems": "center"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-container"
        }
    },
    {
        "comId": "u_btng1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "主按钮",
            "comId": "u_hbtn1",
            "layout": {
                "width": "fit-content",
                "height": 40,
                "marginRight": 16
            },
            "configs": [
                {
                    "path": "按钮/文字标题",
                    "value": "了解招生"
                },
                {
                    "path": "样式/风格",
                    "value": "default"
                },
                {
                    "path": "样式/默认/按钮",
                    "style": {
                        "color": "#1677FF",
                        "backgroundColor": "#FFFFFF",
                        "backgroundImage": "none"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-button"
        }
    },
    {
        "comId": "u_btng1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "次按钮",
            "comId": "u_hbtn2",
            "layout": {
                "width": "fit-content",
                "height": 40
            },
            "configs": [
                {
                    "path": "按钮/文字标题",
                    "value": "校园导览"
                },
                {
                    "path": "样式/风格",
                    "value": "default"
                },
                {
                    "path": "样式/默认/按钮",
                    "style": {
                        "border": "1px solid rgba(255,255,255,0.8)",
                        "color": "#FFFFFF",
                        "backgroundColor": "transparent",
                        "backgroundImage": "none"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-button"
        }
    },
    {
        "comId": "u_hero1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "滚动提示",
            "comId": "u_arrow1",
            "layout": {
                "width": 24,
                "height": "fit-content",
                "marginTop": 48
            },
            "configs": [
                {
                    "path": "常规/选择图标",
                    "value": "DownOutlined"
                },
                {
                    "path": "样式/默认/颜色",
                    "style": {
                        "color": "rgba(255,255,255,0.8)"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.icon"
        }
    },
    {
        "comId": "_root_",
        "type": "addChild",
        "target": "_rootSlot_",
        "params": {
            "title": "学校概况区",
            "comId": "u_abt01",
            "layout": {
                "width": "100%",
                "height": "fit-content",
                "marginTop": 80
            },
            "configs": [
                {
                    "path": "常规/布局",
                    "value": {
                        "display": "flex",
                        "flexDirection": "column",
                        "alignItems": "center"
                    }
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "borderRadius": 12,
                        "padding": "40px 48px",
                        "backgroundColor": "#FFFFFF",
                        "backgroundImage": "none"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-container"
        }
    },
    {
        "comId": "u_abt01",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "区块标题",
            "comId": "u_abth1",
            "ignore": true,
            "layout": {
                "width": "fit-content",
                "height": "fit-content"
            },
            "configs": [
                {
                    "path": "常规/布局",
                    "value": {
                        "display": "flex",
                        "flexDirection": "column",
                        "alignItems": "center"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-container"
        }
    },
    {
        "comId": "u_abth1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "主标题",
            "comId": "u_abtt1",
            "layout": {
                "width": "fit-content",
                "height": "fit-content"
            },
            "configs": [
                {
                    "path": "常规/内容",
                    "value": "学校概况"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "fontSize": 36,
                        "fontWeight": 600,
                        "color": "#333333"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.text"
        }
    },
    {
        "comId": "u_abth1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "英文副标题",
            "comId": "u_abtt2",
            "layout": {
                "width": "fit-content",
                "height": "fit-content",
                "marginTop": 8
            },
            "configs": [
                {
                    "path": "常规/内容",
                    "value": "About Us"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "fontSize": 14,
                        "color": "#999999"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.text"
        }
    },
    {
        "comId": "u_abt01",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "内容区",
            "comId": "u_abtc1",
            "ignore": true,
            "layout": {
                "width": "100%",
                "height": "fit-content",
                "marginTop": 40
            },
            "configs": [
                {
                    "path": "常规/布局",
                    "value": {
                        "display": "flex",
                        "flexDirection": "row",
                        "justifyContent": "space-between",
                        "alignItems": "flex-start"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-container"
        }
    },
    {
        "comId": "u_abtc1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "左侧图片",
            "comId": "u_abti1",
            "layout": {
                "width": 360,
                "height": 240,
                "marginRight": 48
            },
            "configs": [
                {
                    "path": "常规/图片地址",
                    "value": "https://ai.mybricks.world/image-search?term=university campus&w=720&h=480"
                },
                {
                    "path": "常规/填充模式",
                    "value": "cover"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "borderRadius": 12,
                        "boxShadow": "0 4px 12px rgba(0,0,0,0.1)"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.single-image"
        }
    },
    {
        "comId": "u_abtc1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "右侧文案",
            "comId": "u_abtr1",
            "ignore": true,
            "layout": {
                "width": "100%",
                "height": "fit-content"
            },
            "configs": [
                {
                    "path": "常规/布局",
                    "value": {
                        "display": "flex",
                        "flexDirection": "column"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-container"
        }
    },
    {
        "comId": "u_abtr1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "介绍文本",
            "comId": "u_abtp1",
            "layout": {
                "width": "100%",
                "height": "fit-content"
            },
            "configs": [
                {
                    "path": "常规/内容",
                    "value": "学校始建于1920年，是一所学科齐全、师资雄厚的综合性研究型大学。学校秉承“笃学力行、创新致远”的校训，致力于培养具有家国情怀和国际视野的高素质人才。现有全日制在校生3万余人，教职工4000余人。"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "fontSize": 16,
                        "color": "#333333",
                        "lineHeight": 1.8
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.text"
        }
    },
    {
        "comId": "u_abtr1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "数据卡片区",
            "comId": "u_abtd1",
            "ignore": true,
            "layout": {
                "width": "100%",
                "height": "fit-content",
                "marginTop": 32
            },
            "configs": [
                {
                    "path": "常规/布局",
                    "value": {
                        "display": "flex",
                        "flexDirection": "row",
                        "justifyContent": "space-between",
                        "alignItems": "center"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-container"
        }
    },
    {
        "comId": "u_abtd1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "数据1",
            "comId": "u_abd01",
            "layout": {
                "width": 120,
                "height": "fit-content"
            },
            "configs": [
                {
                    "path": "常规/布局",
                    "value": {
                        "display": "flex",
                        "flexDirection": "column",
                        "alignItems": "center"
                    }
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "borderRadius": 8,
                        "padding": "16px",
                        "backgroundColor": "#F5F7FA",
                        "backgroundImage": "none"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-container"
        }
    },
    {
        "comId": "u_abd01",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "数字",
            "comId": "u_abn01",
            "layout": {
                "width": "fit-content",
                "height": "fit-content"
            },
            "configs": [
                {
                    "path": "常规/内容",
                    "value": "120年"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "fontSize": 24,
                        "fontWeight": 600,
                        "color": "#1677FF"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.text"
        }
    },
    {
        "comId": "u_abd01",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "说明",
            "comId": "u_abs01",
            "layout": {
                "width": "fit-content",
                "height": "fit-content",
                "marginTop": 4
            },
            "configs": [
                {
                    "path": "常规/内容",
                    "value": "办学历史"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "fontSize": 14,
                        "color": "#666666"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.text"
        }
    },
    {
        "comId": "u_abtd1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "数据2",
            "comId": "u_abd02",
            "layout": {
                "width": 120,
                "height": "fit-content"
            },
            "configs": [
                {
                    "path": "常规/布局",
                    "value": {
                        "display": "flex",
                        "flexDirection": "column",
                        "alignItems": "center"
                    }
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "borderRadius": 8,
                        "padding": "16px",
                        "backgroundColor": "#F5F7FA",
                        "backgroundImage": "none"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-container"
        }
    },
    {
        "comId": "u_abd02",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "数字",
            "comId": "u_abn02",
            "layout": {
                "width": "fit-content",
                "height": "fit-content"
            },
            "configs": [
                {
                    "path": "常规/内容",
                    "value": "3000亩"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "fontSize": 24,
                        "fontWeight": 600,
                        "color": "#1677FF"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.text"
        }
    },
    {
        "comId": "u_abd02",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "说明",
            "comId": "u_abs02",
            "layout": {
                "width": "fit-content",
                "height": "fit-content",
                "marginTop": 4
            },
            "configs": [
                {
                    "path": "常规/内容",
                    "value": "校园面积"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "fontSize": 14,
                        "color": "#666666"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.text"
        }
    },
    {
        "comId": "u_abtd1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "数据3",
            "comId": "u_abd03",
            "layout": {
                "width": 120,
                "height": "fit-content"
            },
            "configs": [
                {
                    "path": "常规/布局",
                    "value": {
                        "display": "flex",
                        "flexDirection": "column",
                        "alignItems": "center"
                    }
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "borderRadius": 8,
                        "padding": "16px",
                        "backgroundColor": "#F5F7FA",
                        "backgroundImage": "none"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-container"
        }
    },
    {
        "comId": "u_abd03",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "数字",
            "comId": "u_abn03",
            "layout": {
                "width": "fit-content",
                "height": "fit-content"
            },
            "configs": [
                {
                    "path": "常规/内容",
                    "value": "3万+"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "fontSize": 24,
                        "fontWeight": 600,
                        "color": "#1677FF"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.text"
        }
    },
    {
        "comId": "u_abd03",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "说明",
            "comId": "u_abs03",
            "layout": {
                "width": "fit-content",
                "height": "fit-content",
                "marginTop": 4
            },
            "configs": [
                {
                    "path": "常规/内容",
                    "value": "在校生"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "fontSize": 14,
                        "color": "#666666"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.text"
        }
    },
    {
        "comId": "u_abtd1",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "数据4",
            "comId": "u_abd04",
            "layout": {
                "width": 120,
                "height": "fit-content"
            },
            "configs": [
                {
                    "path": "常规/布局",
                    "value": {
                        "display": "flex",
                        "flexDirection": "column",
                        "alignItems": "center"
                    }
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "borderRadius": 8,
                        "padding": "16px",
                        "backgroundColor": "#F5F7FA",
                        "backgroundImage": "none"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.custom-container"
        }
    },
    {
        "comId": "u_abd04",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "数字",
            "comId": "u_abn04",
            "layout": {
                "width": "fit-content",
                "height": "fit-content"
            },
            "configs": [
                {
                    "path": "常规/内容",
                    "value": "95%"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "fontSize": 24,
                        "fontWeight": 600,
                        "color": "#1677FF"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.text"
        }
    },
    {
        "comId": "u_abd04",
        "type": "addChild",
        "target": "content",
        "params": {
            "title": "说明",
            "comId": "u_abs04",
            "layout": {
                "width": "fit-content",
                "height": "fit-content",
                "marginTop": 4
            },
            "configs": [
                {
                    "path": "常规/内容",
                    "value": "就业率"
                },
                {
                    "path": "样式/默认/默认",
                    "style": {
                        "fontSize": 14,
                        "color": "#666666"
                    }
                }
            ],
            "namespace": "mybricks.normal-pc.antd5.text"
        }
    },
]