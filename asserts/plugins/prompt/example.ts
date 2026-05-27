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

  \`\`\`tsx file="pages/signup/index.config.ts"
  export default definePageConfig({
    navigationBarTitleText: '注册'
  })
  \`\`\`
`
