export const APP_CONFIG_CODE = `
  \`\`\`tsx file="app.config.ts"
  export default defineAppConfig({
    pages: [
      'pages/signin/index',
      'pages/signup/index'
    ],
    window: {
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#fff',
      navigationBarTitleText: 'Login',
      navigationBarTextStyle: 'black'
    }
  })
  \`\`\`

  \`\`\`tsx file="app.tsx"
  import { appRef } from 'mybricks'
    
  import './app.less'

  /**
   * @mybricks
   * name: default
   * title: 登录/注册应用入口
   * summary: 应用根节点，通过路由提供登录页与注册页的切换与展示。
   * type: app
   */
  export default appRef(({ children }) => {
    return children
  })
  \`\`\`

  \`\`\`tsx file="pages/signin/index.tsx"
  import { useState } from 'react'
  import dataSource from '../../dataSource'
  import { comRef } from 'mybricks'
  import { View, Text, Button } from '@tarojs/components'
  import css from './index.module.less'
  /**
   * @mybricks
   * name: SignIn
   * title: 登录页
   * summary: 用户登录入口页，提供登录按钮并触发 signIn 完成登录。
   * type: page
   * datasource:
   *   signInBtn:
   *     signIn:
   *       desc: 点击登录按钮调用登录接口 dataSource.signIn 完成登录
   * state:
   *   loginInfo:
   *     welcomeMsg:
   *       desc: 展示欢迎语
   *     userType:
   *       desc: 展示用户类型
   *   signInBtn:
   *     loading:
   *       desc: 登录接口请求中的加载状态
   * events:
   *   signInBtn:
   *     onClick:
   *       title: 登录
   *       mermaid: 'flowchart LR; A["校验登录参数"] --> B{"参数是否有效"} -->|有效| C["设置loading状态"] --> D["请求登录接口"] --> E{"请求是否成功"} -->|成功| F["更新用户状态"] --> G["取消loading状态"]; E -->|失败| H["提示错误信息"] --> G; B -->|无效| I["提示参数错误"]'
   */
  const SignIn = comRef(({}) => {
    const [welcomeMsg, setWelcomeMsg] = useState('')
    const [userType, setUserType] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSignIn = async () => {
      setLoading(true)
      try {
        const res = await dataSource.signIn({})
        setWelcomeMsg(res.welcomeMsg)
        setUserType(res.userType)
      } finally {
        setLoading(false)
      }
    }
    return (
      <View className={css.container}>
        <Text className={css.title}>登录</Text>
        <View className={css.loginInfo}>
          {welcomeMsg} - {userType}
        </View>
        <Button
          className={\`\${css.signInBtn}\${loading ? \` \${css.loading}\` : ''}\`}
          onClick={handleSignIn}
        >
          登录
        </Button>
      </View>
    )
  })

  export default SignIn
  \`\`\`

  \`\`\`tsx file="pages/signin/index.config.ts"
  export default definePageConfig({
    navigationBarTitleText: '登录'
  })
  \`\`\`

  \`\`\`tsx file="pages/signup/index.tsx"
  import { useState } from 'react'
  import dataSource from '../../dataSource'
  import { comRef } from 'mybricks'
  import { View, Text, Button } from '@tarojs/components'
  import css from './index.module.less'

  /**
   * @mybricks
   * name: StepRegisterForm
   * title: 注册表单区块
   * summary: 注册表单容器，包含注册按钮，提交时触发 signUp。
   * type: com
   * datasource:
   *   registerBtn:
   *     signUp:
   *       desc: 点击注册按钮调用注册接口 dataSource.signUp 完成注册
   * state:
   *   registerBtn:
   *     loading:
   *       desc: 注册接口请求中的加载状态
   * events:
   *   registerBtn:
   *     onClick:
   *       title: 注册
   *       mermaid: 'flowchart LR; A["校验表单参数"] --> B{"参数是否有效"} -->|有效| C["设置loading状态"] --> D["请求注册接口"] --> E{"请求是否成功"} -->|成功| F["跳转登录页"] --> G["取消loading状态"]; E -->|失败| H["提示错误信息"] --> G; B -->|无效| I["提示参数错误"]'
   */
  const StepRegisterForm = comRef(({}) => {
    const [loading, setLoading] = useState(false)

    const handleSignUp = async () => {
      setLoading(true)
      try {
        await dataSource.signUp({})
      } finally {
        setLoading(false)
      }
    }
    return (
      <View className={css.form}>
        <Button
          className={\`\${css.registerBtn}\${loading ? \` \${css.loading}\` : ''}\`}
          onClick={handleSignUp}
        >注册</Button>
      </View>
    )
  })

  /**
   * @mybricks
   * name: SignUp
   * title: 注册页
   * summary: 用户注册入口页，内嵌注册表单组件完成填写与提交。
   * type: page
   */
  const SignUp = comRef(() => {
    return (
      <View className={css.container}>
        <Text className={css.title}>注册</Text>
        <StepRegisterForm />
      </View>
    )
  })

  export default SignUp
  \`\`\`

  \`\`\`tsx file="pages/signup/index.less"
  .container {
    position: relative;
    width: 100%;
    height: 100%;
    .title {}
  }
  \`\`\`

  \`\`\`tsx file="pages/signup/store.ts"
  import { makeAutoObservable } from 'mybricks'
  import Taro from '@tarojs/taro'

  class SignUpStore {
    constructor() {
      makeAutoObservable(this)
    }

    signUp() {
      logger.info('[SignUpStore/signUp] 开始注册')
      Taro.showLoading({
        title: '注册中',
      })
      // 注册逻辑省略
      logger.info('[SignUpStore/signUp] 注册成功')
      Taro.hideLoading()
      Taro.showToast({
        title: '注册成功',
        icon: 'success',
      })
    }
  }
  \`\`\`

  \`\`\`tsx file="pages/signup/index.config.ts"
  export default definePageConfig({
    navigationBarTitleText: '注册'
  })
  \`\`\`
`


export const DATA_SOURCE_CODE = `

\`\`\`ts file="dataSource.ts"
import { DataSource } from 'mybricks'

class MyDatasource extends DataSource {

  constructor() { 
    super()
    this.axios.defaults.baseURL = '' 
  }

  async getUserById({ id }) {
  
  }

  async createUser(data) {
  }
}

export default new MyDatasource()
\`\`\`

`

export const SETUP_CODE = `
\`\`\`ts file="app.config.ts"
import { describe, spyOn } from 'mybricks/testing'
import dataSource from './dataSource'

// 必须：设计态 mock 环境
describe('mock', () => {
  // 上面 getUserById 直接返回一个axios.get，可以确定里面有status、data字段
  spyOn(dataSource, 'getUserById').mockReturn({
    status: 200,
    data: { 
      errorCode: 0,
      traceId: '10001',
      status: 200,
      msg: '获取用户信息成功',
      data: { id: 1, name: '张三', age: 18 } 
    },
  })
})

// 按需：用户需要的话，需要配置中文名
describe('预发环境', () => {
  // 预发请求staging环境接口和特殊headers
  dataSource.axios.defaults.baseURL = 'https://api.staging.com';
  dataSource.axios.defaults.headers.common['x-env'] = 'staging';
})

// 按需：用户需要的话，需要配置中文名
describe('无权限测试', () => {
  // 测试接口403情况
  spyOn(dataSource, 'getUserById').mockReturn({
    status: 403,
  })
})
\`\`\`

`

export const SCHEME_CODE = `

\`\`\`ts file="scheme.ts"
const scheme = [
  {
    "id": 1,
    "cnName": "获取商品列表",
    "name": "get_product_list",
    "baseUrl": "",
    "method": "GET",
    "path": "",
    "response": {
      "code": {
        "required": true,
        "type": "string",
        "description": "结果标识: sucess 或 error"
      },
      "message": {
        "required": true,
        "type": "string",
        "description": "提示信息"
      },
      "data": {
        required: true,
        "type": "object",
        "description": "返回数据主体",
        "properties": {
          "id": {
            "required": true,
            "type": "string",
            "description": "用户ID"
          },
          "userInfo": {
            "required": true,
            "type": "object",
            "description": "用户信息",
            "properties": {
              "province": {
                "required": true,
                "type": "string",
                "description": "省"
              },
              "city": {
                "required": true,
                "type": "string",
                "description": "市"
              },
              "district": {
                "required": true,
                "type": "string",
                "description": "区"
              }
            }
          },
          "auditStatus": {
            "required": true,
            "type": "array",
            "description": "审核状态选项列表",
            "items": {
              "type": "object",
              "properties": {
                "key": {
                  "required": true,
                  "type": "string",
                  "description": "状态值"
                },
                "value": {
                  "required": true,
                  "type": "string",
                  "description": "状态名称"
                }
              }
            }
          }
        }
      }
    }
  }
]
export default scheme
\`\`\`

`

export const SCHEME_MANUAL = `
<scheme的约束>
 
  /**
 * HTTP 请求方法
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * 基础字段描述：仅能用于 errorCode / msg / status / traceId 等简单字段
 * 不允许包含 properties 和 items
 */
interface SimpleFieldDescriptor {
  required: boolean;
  type: string;          // "string" | "number" | "boolean"
  description: string;
}

/**
 * 完整字段描述：用于 request 参数、以及 data.properties 内部
 * 支持对象 (properties) 和数组 (items) 的递归描述
 */
interface FieldDescriptor extends SimpleFieldDescriptor {
  /** 当 type 为 "object" 时，描述子字段 */
  properties?: Record<string, FieldDescriptor>;
  /** 当 type 为 "array" 时，描述数组元素类型 */
  items?: FieldDescriptor;
}

/**
 * data 字段的描述符：固定 type 为 "object"，且必须包含 properties
 */
interface DataDescriptor {
  required: true;        // data 必须总是 required
  type: "object";
  description: string;
  properties: Record<string, FieldDescriptor>;
}

/**
 * 每个 API 的固定响应结构 —— 强制四个简单字段 + 一个 data
 */
interface ApiResponse {
  errorCode: SimpleFieldDescriptor;  // 业务错误码，0成功，非0失败
  msg: SimpleFieldDescriptor;
  status: SimpleFieldDescriptor;    // 业务状态码，默认为 200
  traceId: SimpleFieldDescriptor;
  data: DataDescriptor;
}

/**
 * API 方案条目
 */
interface SchemeItem {
  /** 方案唯一标识 */
  id: number;
  /** 中文名称 */
  cnName: string;
  /** 英文名称（写法：snake_case） */
  name: string;
  /** 基础 URL */
  baseUrl: string;
  /** 请求方法 */
  method: HttpMethod;
  /** 请求路径（由\`operate-api\` 同步，未同步时为: ""） */
  path: string; 
  /** 请求参数定义（可选） */
  request?: Record<string, FieldDescriptor>;
  /** 真实的响应参数定义（非HTTP响应） */
  response: ApiResponse;
}

<scheme的约束/>

\`\`\``