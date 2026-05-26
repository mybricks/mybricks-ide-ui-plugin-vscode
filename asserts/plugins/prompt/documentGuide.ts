const firstOfAll = `
### JSDoc 注释
编写或修改 appRef / comRef / popupRef 节点代码时，必须为每一个节点同步编写或更新对应的 JSDoc 注释说明。JSDoc 注释属于代码的一部分，承载原 README.md 中的代码可视化说明信息，必须与节点代码一起生成、一起维护。禁止只给页面节点、根节点或少数组件写注释。
维护时机：
- 必须维护（强约束）：节点缺少 JSDoc 注释；或现有注释内容与「注释编写规范」不符；或需求明确要求更新注释（此时必须重新逐行审查源码与注释的差异，确保注释完全对齐当前源码，包括 events/datasource/state 的 className 标识、字段、流程图等）；或需求明确要求更新文档，注意用户要求的更新文档也包括了JSDoc注释；
- 建议更新（结构或内容变化）：在 tsx 中新增、删除或重命名了 appRef/comRef 节点，或通过 \`app.config.ts\` 的 pages 注册的页面组件发生变化；export default 的根节点类型或子节点类型组合发生变化导致标题层级需调整；JSX 中新增、删除或修改了带事件 props（onClick 等）的元素，或其 className 发生变化；JSX 中新增、删除或修改了渲染组件内状态（useState/useReducer 等 hooks 管理的状态）的元素，或其 className 发生变化；JSX 中新增、删除或修改了触发 datasource 调用的元素，或其 className 发生变化；某节点的 UI 结构、交互或业务含义发生明显变化；
- 无需更新：tsx 未被修改，且现有 JSDoc 注释已正确反映当前源码的节点结构、事件与说明；仅修改了 style.less 等与节点行为无关的文件；
<JSDoc 注释编写规范>

  <节点>
  按「在 JSX 中依赖顺序」为每个节点分别写出 JSDoc 注释。
  - appRef 应用节点
  - 页面节点：通过 \`app.config.ts\` 的 pages 注册的页面视为页面节点
  - comRef 组件节点（未通过 \`app.config.ts\` 的 pages 注册的）
  - popupRef 浮层节点
  - 【强制】所有 appRef / comRef / popupRef 声明都必须有 JSDoc 注释，包括页面内拆分的辅助 comRef、列表单项 comRef、弹窗 popupRef、export default comRef/appRef；不得只给通过 \`app.config.ts\` 的 pages 注册的页面组件或根节点写注释。
  </节点>

  <注释位置>
  - export default appRef/comRef/popupRef：JSDoc 写在 export default 语句正上方；
  - const Xxx = appRef/comRef/popupRef(...)：JSDoc 写在 const 声明正上方；
  - 子节点注释紧跟其节点声明，不集中写在文件顶部或底部；
  - 已存在 JSDoc 时直接更新原注释，禁止新增重复注释。
  </注释位置>

  <节点说明>
  
  每个节点 JSDoc 统一使用 @mybricks 自定义 tag 承载结构化信息，@mybricks 下方直接书写缩进结构；字段名保持稳定，字段内容按原 README.md 的语义填写。不要使用多层 Markdown 列表或代码围栏表达结构化数据。
  - name：节点名称，对应代码中节点变量声明的变量名，如果是export default 导出，则对应文件名；
  - title：根据节点内容与名称写出简洁的语义化标题，体现节点职责，避免与组件名简单重复（如组件叫 SignIn 时 title 可用「登录页」而非「登录」）；
  - summary：对节点的用途、场景或关键行为做简短说明，补充 title 未涵盖的信息，避免与 title 重复或仅罗列 UI 元素；
  - type：app | page | com | popup，其中 app 对应 appRef，page 对应通过 \`app.config.ts\` 的 pages 注册的 comRef（页面组件），com 对应 comRef（非路由页面），popup 对应 popupRef。
  - datasource：该组件内触发的 dataSource.ts 接口调用列表（找最近的组件，而不是页面）
    > 触发机制：JSX 中的事件处理器或 React hooks（如 useEffect、useCallback 等）直接调用 dataSource.ts 中的函数发起 HTTP 请求。JSDoc 的 datasource 字段记录的是实际调用到 dataSource.ts 中哪个函数。
    > 判断标准：组件代码（事件处理函数、hooks 回调等）中有 \`await dataSource.xxx()\` 或 \`dataSource.xxx()\` 调用，则该调用必须记录在 datasource 字段中，api 名称对应 dataSource.ts 中的函数名。
    1. datasource 不一定能稳定归属到某个 JSX 标签，因此写在最近的 appRef/comRef/popupRef 节点 JSDoc 中
    2. 每条接口调用用缩进对象结构描述，包含以下字段：
      className（对应触发接口调用的元素 className）:
        api（dataSource.ts 中导出的真实函数名，如 signIn、fetchUserList 等）:
          desc: 用途说明
    3. 特殊情况：当接口调用由 React hooks（如 useEffect）在组件初始化时发起、不属于任何具体交互元素时，使用「root」作为标识，表示「该组件挂载时的初始化请求」；如果接口调用是由某个具体的交互元素（如按钮、表单）触发的，必须使用该元素的 className 作为标识，禁止错误地归到「root」下
    4. 【严禁重复】datasource 注释必须以 com 节点为最小单位归属：接口调用发生在哪个 comRef/popupRef 的 JSX 作用域内，就只写在该节点注释中，其父节点禁止重复声明。
    5. 无接口调用直接省略 datasource 字段，禁止出现「(无接口调用)」或空对象，不写即代表无调用
    6. 【强制扫描】编写 datasource 注释前，必须仔细阅读组件代码，检查每个事件处理函数与 React hooks 回调体内是否有 dataSource.xxx() 的调用；凡是有调用的，无论由按钮触发还是由 useEffect 触发，都必须记录到 datasource 字段中。
  - state：该组件内渲染到 JSX 的 React 状态列表（useState/useReducer 等 hooks 管理的状态，找最近的组件，而不是页面）
    1. state 不一定能稳定归属到某个 JSX 标签，因此写在最近的 appRef/comRef/popupRef 节点 JSDoc 中；如果状态值直接渲染在 JSX 标签上，用该标签的 className 作为标识；【强制前提】渲染状态的元素必须有 className，如果源码中缺少，必须先在代码中补上 className，再写注释
      - 在子节点中直接渲染：\`<View className={css.xxx}>{someState}</View>\`
      - 通过 prop 传入：\`<Image className={css.xxx} src={imageUrl} />\`（imageUrl 为 state 变量）
    2. 每个 className 下描述该元素渲染的状态变量及用途：
      className（对应渲染状态的元素 className）:
        状态变量名（组件内 useState/useReducer 声明的变量名）:
          desc: 用途说明
        状态变量名:
          desc: ...
    3. 「root」使用条件（极端严格限制）：**只有当该组件的 JSX 根元素自身没有 className，且直接在根元素上渲染了状态数据**时，才允许使用「root」作为标识。绝对禁止将子孙元素渲染的状态写在「root」下——子孙元素必须用其自身的 className 作为标识，哪怕需要先在代码中补上 className 再写注释。
    4. 每一个组件，如果在代码层面没有将 React 状态用于 JSX 的 UI 渲染（即状态只用于逻辑控制、不直接影响视觉输出），禁止编写 state 信息；即使子组件使用了，也不应该使用 root，以实际代码情况为准；
    5. 【严禁重复】state 注释必须以 com 节点为最小单位归属：如果状态是在某个子 com 节点内消费的，则 state 条目只能写在该 com 节点注释中，其父节点（page 或上层 com）禁止重复声明相同的 state 条目。判断标准：状态的实际渲染发生在哪个 comRef/popupRef 的 JSX 作用域内，就归属于哪个节点，不随层级向上传递。
    6. 无状态渲染直接省略 state 字段，禁止出现「(无状态渲染)」或空对象，不写即代表无状态渲染
    7. 【精确粒度】className 标识必须是实际渲染状态的那个元素的 className，而不是其父容器的 className。例如：\`<View className={css.card}><Text className={css.userName}>{userName}</Text></View>\`，state 标识应该是 \`userName\`，而不是 \`card\`。
    8. 【严禁】禁止将外部来源的值计入 state 字段，state 字段仅用于记录组件自身通过 React hooks 管理的状态
  - events：该组件内所有带事件 props 的交互元素列表，写在最近的 appRef/comRef/popupRef 节点 JSDoc 中
    1. 【强制前提】带事件的元素必须有 className，如果源码中缺少，必须先在代码中补上 className，再写事件注释；
    2. 每个事件用 className 作为标识，每个 className 下描述该元素上的事件及其流程图：
      className（对应带事件的元素 className）:
        事件名（如 onClick、onChange、onBlur 等）:
          title: 简短中文说明（如 登录）
          mermaid: 根据事件内容生成对应的 Mermaid 语法流程图（以 flowchart LR; 开头，单行书写）
          relations:（可选）事件如果涉及打开弹窗、跳转页面，则需要声明关联节点及关系类型
            关联的弹窗或页面的名称，即对应的节点名称
              type: 关系类型（page，popup），打开弹窗使用popup，跳转页面使用page
    3. 【严禁重复】events 注释必须以 com 节点为最小单位归属：事件发生在哪个 comRef/popupRef 的 JSX 作用域内，就只写在该节点注释中，其父节点禁止重复声明。
    4. 无交互事件直接省略 events 字段，禁止出现空对象，不写即代表无事件
    5. 【严禁使用 root 作为 key】events 字段下的每个 key 必须是带事件的元素的 className，绝对禁止使用「root」作为 events 的 key。events 只描述具体元素或组件的 onXXX 实现，不存在「整个根节点」的事件。如果某元素没有 className，必须先在代码中补上 className，再以该 className 作为 key。
  关于 Mermaid 语法流程图需关注以下规则和要求：
  - 流程图方向统一用 LR（从左到右），节点文本全部用双引号包裹；
  - 条件判断节点用 {} 包裹，分支标注用 |标注内容| 写在箭头上；
  - 【重要】判断节点的分支必须分开写：从判断节点出发，每个分支单独写一条「箭头」，用分号分隔多条语句。正确示例：B{"是否展开"} -->|是| C["移除"]; B -->|否| D["添加"]。错误示例：B{"是否展开"} -->|是| C["移除"] -->|否| D["添加"]；
  - 每条语句末尾加分号分隔，最后一条语句后不加分号；
  - 生成后先自检：检查是否有多余分号、引号是否统一、节点连接是否完整（无断链、无悬空节点）、每个判断分支是否都从判断节点单独引出；
  - 流程图逻辑要贴合需求，节点命名简洁易懂，避免冗余步骤；
  - 流程图需覆盖全链路：事件处理函数与 hooks 回调的完整逻辑均需展开，从触发到结束完整呈现；
  - 禁止出现「调用 XX API」「调用 XX 函数」等无意义节点，所有 API 及函数调用均须展开其内部逻辑，写出完整流程；
  - 流程图节点用动作描述，不写具体取值：例如用「设置loading状态」「取消loading状态」，禁止「设置loading为true」「设置loading为false」等；
  - 禁止出现用户动作类流程节点（如「点击按钮」）、空洞节点（如「开始」「结束」「执行业务操作」）；
  - 流程图须真实完整：严格依据事件处理函数与 hooks 回调内的实际代码逻辑来绘制，不省略、不捏造。
  - 分支流程必须完整表达：代码中的 if/else、三元判断、early return、请求成功/失败等所有分支，都必须在流程图中用条件节点 {} 和 |分支标注| 画出；每个分支（如「通过」「不通过」「成功」「失败」）及其后续步骤都须独立延伸，不得只写主流程而省略条件分支。
  </节点说明>

</JSDoc 注释编写规范>

<基于 tsx 的 JSDoc 注释示例>
如果某一个组件源代码如下（包含 dataSource.ts 接口文件、各页面的 tsx 文件），可以看到有三个comRef（其中两个为页面节点）、一个appRef，所以需要为一个app节点、两个页面节点、一个组件节点分别补充 JSDoc 注释。每个 appRef / comRef / popupRef 声明都必须有自己的 JSDoc 注释。
<基于 tsx 的 JSDoc 注释示例>
如果某一个组件源代码如下（包含 dataSource.ts 接口文件、各页面的 tsx 文件），可以看到有三个comRef（其中两个为页面节点）、一个appRef，所以需要为一个app节点、两个页面节点、一个组件节点分别补充 JSDoc 注释。每个 appRef / comRef / popupRef 声明都必须有自己的 JSDoc 注释。

注意：datasource 字段记录的 api 名称，必须是 dataSource.ts 文件中真实导出的函数名。判断是否需要写 datasource，关键是看组件代码（事件处理函数、hooks 回调等）中是否有 dataSource.xxx() 的直接调用。

\`\`\`ts
// dataSource.ts —— 项目唯一的接口文件，所有 HTTP 请求都定义在这里
import { DataSource } from "mybricks";

interface LoginParams {
  username: string;
  password: string;
}

interface LoginResult {
  status: number;
  data?: {
    token: string;
    user: {
      id: number;
      name: string;
    };
  };
}

class MyDatasource extends DataSource {
  async signIn(params: LoginParams): Promise<LoginResult> {
    return this.axios.post("/api/sign-in", params);
  }

  async signUp(params: LoginParams): Promise<LoginResult> {
    return this.axios.post("/api/sign-up", params);
  }
}

export default new MyDatasource();
\`\`\`

\`\`\`tsx
// pages/signin/index.tsx 和 pages/signup/index.tsx 合并展示
import { useState } from 'react';
import dataSource from '../../dataSource';
import { comRef, appRef } from 'mybricks'
import { View, Text, Button, Form } from '@tarojs/components'

/**
 * @mybricks
 * name: StepRegisterForm
 * title: 注册表单区块
 * summary: 注册表单容器，包含表单与注册按钮，提交时触发 signUp。
 * type: com
 * datasource:
 *   signUpBtn:
 *     signUp:
 *       desc: 点击注册按钮调用注册接口 dataSource.signUp 完成注册
 * state:
 *   signUpBtn:
 *     loading:
 *       desc: 注册接口请求中的加载状态
 * events:
 *   signUpBtn:
 *     onClick:
 *       title: 注册
 *       mermaid: 'flowchart LR; A["校验表单参数"] --> B{"参数是否有效"} -->|有效| C["设置loading状态"] --> D["请求注册接口"] --> E{"请求是否成功"} -->|成功| F["跳转登录页"] --> G["取消loading状态"]; E -->|失败| H["提示错误信息"] --> G; B -->|无效| I["提示参数错误"]'
 */
const StepRegisterForm = comRef(({}) => {
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    try {
      await dataSource.signUp(); // 直接调用 dataSource.signUp
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Form />
      <Button
        className={\`\${css.signUpBtn}\${loading ? \` \${css.loading}\` : ''}\`}
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
    <View>
      <Text>注册</Text>
      <StepRegisterForm />
    </View>
  )
})

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
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const res = await dataSource.signIn({}); // 直接调用 dataSource.signIn
      setWelcomeMsg(res.welcomeMsg);
      setUserType(res.userType);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text>登录</Text>
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
</基于 tsx 的 JSDoc 注释示例>
`

export default {
    firstOfAll
}