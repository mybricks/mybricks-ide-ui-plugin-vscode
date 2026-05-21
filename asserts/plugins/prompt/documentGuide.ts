import { APP_CONFIG_CODE } from './example'
import apiGuide from './apiGuide'


const firstOfAll = `
### README.md
根据当前应用的 tsx 源码，生成或更新对应的 README.md 说明文档
更新时机：
- 必须更新（强约束）：目录下不存在 README.md；或当前文档内容与「文档编写规范」不符；或需求明确要求更新文档；
- 建议更新（结构或内容变化）：在 tsx 中新增、删除或重命名了 appRef/comRef 节点，或通过 \`app.config.ts\` 中 pages 注册的页面发生变化；export default 的根节点类型或子节点类型组合发生变化导致标题层级需调整；JSX 中新增、删除或修改了带 /** onXXX:唯一key */ 注释的事件；某节点的 UI 结构、交互或业务含义发生明显变化；
- 无需更新：tsx、store.ts 未被修改，且现有 README.md 已正确反映当前源码的节点结构、事件与说明；仅修改了 less 等与节点行为无关的文件；
<README.md 文档编写规范>
  <节点>
  按「在 JSX 中依赖顺序」依次写出，层级用标题级别表示。
  - appRef 应用节点
  - 页面节点：通过 \`app.config.ts\` 的 pages 注册的页面视为页面节点
  - comRef 组件节点（未通过 \`app.config.ts\` 的 pages 注册的）
  </节点>

  <根节点>
  对应 export default ...，根节点可以是任意类型；文档中根节点标题固定为「# default」。
  </根节点>

  <标题层级>
  全文标题最多三级（一级 #、二级 ##、三级 ###）。根节点固定为「# default」；其余节点的标题级别由「当前应用实际出现的类型」决定：
  - 若同时存在 app、page、com：app 对应一级（根即 # default）、page 对应二级（##）、com 对应三级（###）；
  - 若仅有 page 与 com：page 对应一级（根即 # default）、com 对应二级（##）；
  - 若仅有 app 与 page 或单层类型，则按实际层级依次使用 ##、###，层级连续且不超过三级。
  - 标题内容对应代码中各节点变量声明的变量名；
  - 必须按层级关系书写，子节点紧跟在父节点之后，不能将同级标题集中写在前面。例如有 page1（含 com1、com2）和 page2（含 com1、com2）时，正确顺序为：## page1 → ### com1 → ### com2 → ## page2 → ### com1 → ### com2；不能先写所有 ## page，再写所有 ### com。
  </标题层级>

  <节点说明>
  - title：根据节点内容与名称写出简洁的语义化标题，体现节点职责，避免与组件名简单重复（如组件叫 SignIn 时 title 可用「登录页」而非「登录」）；
  - summary：对节点的用途、场景或关键行为做简短说明，补充 title 未涵盖的信息，避免与 title 重复或仅罗列 UI 元素；
  - type：app | page | com，其中 app 对应 appRef，page 对应通过 \`app.config.ts\` 中 pages 注册的页面，com 对应 comRef（非页面）。
  - events：该组件内声明的事件列表（找最近的组件，而不是页面）
    1. 从源码识别：JSX 块注释如 /** onClick:唯一key */（或其它 onXXX:唯一key）
    2. 每条事件用结构化格式描述，包含以下字段：
        - 唯一key(只允许英文字符)
          - title: 简短中文说明（如 登录）
          - mermaid: 根据事件内容生成对应的 Mermaid 语法流程图（以 flowchart LR; 开头，单行书写）
          - relation:
            - type: 关系类型（page，popup），打开弹窗使用popup，跳转页面使用page
            - name: 关联的弹窗或页面的名称，即对应的节点名称
      注意格式要严格保持一致；
      关于relation，只有一条对应关系，事件如果涉及到打开弹窗、跳转页面，则需要relation说明；
      关于 Mermaid 语法流程图需关注以下规则和要求：
        - 流程图方向统一用 LR（从左到右），节点文本全部用双引号包裹；
        - 条件判断节点用 {} 包裹，分支标注用 |标注内容| 写在箭头上；
        - 【重要】判断节点的分支必须分开写：从判断节点出发，每个分支单独写一条「箭头」，用分号分隔多条语句。正确示例：B{"是否展开"} -->|是| C["移除"]; B -->|否| D["添加"]。错误示例：B{"是否展开"} -->|是| C["移除"] -->|否| D["添加"]（这样会把「否」错误地连成 C→D，而不是 B→D）；
        - 每条语句末尾加分号分隔，最后一条语句后不加分号；
        - 生成后先自检：检查是否有多余分号、引号是否统一、节点连接是否完整（无断链、无悬空节点）、每个判断分支是否都从判断节点单独引出；
        - 流程图逻辑要贴合需求，节点命名简洁易懂，避免冗余步骤；
        - 流程图需覆盖全链路：事件处理与 store 方法内部均需展开，从触发到结束完整呈现；
        - 禁止出现「调用 XX API」「调用 XX 函数」等无意义节点，所有 API 及函数调用均须展开其内部逻辑，写出完整流程；
        - 流程图节点用动作描述，不写具体取值：例如用「设置loading状态」「取消loading状态」，禁止「设置loading为true」「设置loading为false」等；
        - 禁止出现用户动作类流程节点（如「点击按钮」）、空洞节点（如「开始」「结束」「执行业务操作」）；
        - 流程图须真实完整：严格依据事件处理函数内的代码逻辑，以及所调用的 store 方法内部实现来绘制，不省略、不捏造。
        - 分支流程必须完整表达：代码中的 if/else、三元判断、early return、请求成功/失败等所有分支，都必须在流程图中用条件节点 {} 和 |分支标注| 画出；每个分支（如「通过」「不通过」「成功」「失败」）及其后续步骤都须独立延伸，不得只写主流程而省略条件分支。
    3. 无事件可省略 events
  - datasource：该组件内调用的接口列表（找最近的组件，而不是页面）
    1. 从源码识别：JSX 块注释如 /** datasource:唯一key */
    2. 每条接口调用用结构化格式描述，包含以下字段：
      - 唯一key(只允许英文字符)
        - api（真实方法名，对应 datasource 中的方法）
          - desc: 用途说明
    3. 特殊情况：当接口调用在函数体或 React hooks（如 useEffect）内时，使用「root」作为唯一key
    4. 无接口调用可省略 datasource
  - store：该组件内消费的store数据列表（找最近的组件，而不是页面）
    1. 从源码识别：JSX块注释如 /** store:唯一key */
    2. 每个唯一key下是一个数组，支持描述多个字段的消费（可能来自不同store或同一store的不同字段）：
      - 唯一key(只允许英文字符)
        - 对应store文件的绝对路径
          - field: 对应store的属性路径
          - desc: 用途说明
        - 对应store文件的绝对路径
          - field: ...
          - desc: ...
    3. 特殊情况：当容器本身即为组件时（如 Fragment），使用「root」作为唯一key，path/field 正常填写
    4. 每一个组件，如果在代码层面没有读取 store 的字段来做ui以及视觉的渲染，禁止编写store信息；即使子组件使用了，也不应该使用root，以实际代码情况为准；
    5. 无store数据消费可省略 store
  </节点说明>
</README.md 文档编写规范>

<基于 tsx 的README.md示例>
如果某一个组件源代码如下，可以看到有有四个comRef（其中两个为页面节点）、一个appRef，所以文档包含一个app节点、两个页面节点、一个组件节点。
${APP_CONFIG_CODE}

\`\`\`md file="README.md"
# default

- title: 登录/注册应用入口
- summary: 应用根节点，通过路由提供登录页与注册页的切换与展示。
- type: app

---

## SignIn

- title: 登录页
- summary: 用户登录入口页，提供登录按钮并触发 signIn 完成登录。
- type: page
- events:
  - signIn
    - title: 登录
    - mermaid: flowchart LR; A["校验登录参数"] --> B{"参数是否有效"} -->|有效| C["设置loading状态"] --> D["请求登录接口"] --> E{"请求是否成功"} -->|成功| F["更新用户状态"] --> G["取消loading状态"]; E -->|失败| H["提示错误信息"] --> G; B -->|无效| I["提示参数错误"]
- datasource:
  - clickToSignIn
    - signIn
      - desc: 点击登录按钮调用登录接口
- store:
  - loginInfo
    - /store.ts
      - field: welcomeMsg
      - desc: 展示欢迎语
    - /store.ts
      - field: userType
      - desc: 展示用户类型

（SignIn 是通过 \`app.config.ts\` 中 pages 注册的页面，因此 type 为 page）

---

## SignUp

- title: 注册页
- summary: 用户注册入口页，内嵌注册表单组件完成填写与提交。
- type: page

（SignUp 是通过 \`app.config.ts\` 中 pages 注册的页面，因此 type 为 page）

---

### StepRegisterForm

- title: 注册表单区块
- summary: 注册表单容器，包含表单与注册按钮，提交时触发 signUp。
- type: com
- events:
  - signUp
    - title: 注册
    - mermaid: flowchart LR; A["校验表单参数"] --> B{"参数是否有效"} -->|有效| C["设置loading状态"] --> D["请求注册接口"] --> E{"请求是否成功"} -->|成功| F["跳转登录页"] --> G["取消loading状态"]; E -->|失败| H["提示错误信息"] --> G; B -->|无效| I["提示参数错误"]
- datasource:
  - clickToSignUp
    - signUp
      - desc: 点击注册按钮调用注册接口

\`\`\`
</基于 tsx 的README.md示例>

${apiGuide.firstOfAll}
`

const requirementGuide = `<requirement.md 文档编写规范>
更新时机：
- 必须更新（强约束）：目录下不存在 requirement.md；或需求明确要求更新文档；
- 建议更新：用户的需求目的有更新；源代码关联组件名发生了变化；

书写规范：
- 总体原则：从产品视角梳理，关注整体业务流程、业务规则、效果、业务逻辑和目标；永远不要将源代码中冗余详细的前端信息写进 requirement.md，这是需求文档，不是代码文档；
- 文件顶部必须有 YAML front matter（用 --- 包裹），包含：
  - title：项目标题
  - desc：项目的一句话描述
- 一级标题「# 一、需求背景」：包含背景、目标、流程图、文字描述等，不要过于详细，但需要能够展示清楚内容；
- 一级标题「# 二、需求概述」：按照模块对需求进行拆分，展示一个表格，表头为需求、说明、优先级三列；
- 一级标题「# 三、需求详情」：按照功能点列表详细描述，每一个功能用二级标题，同时需要声明 type（new / edit）、涉及到的组件 related、优先级 rank（P0–P5），内容可以包含文本、列表、流程图、表格等；
- 一级标题「# 四、数据需求」（可选）：提供对数据指标的定义、埋点和监控需求，一般用表格展示；
</requirement.md 文档编写规范>

<requirement.md示例>
\`\`\`md
---
title: 开播理由BD工具
desc: 提供新增商品链路，覆盖*40%*中小商家的快速新增商品需求
---

# 一、需求背景

## 1.1 业务背景

核心问题的表格...

## 1.2 策略和解法
> 整体思路：选对象 -> 做诊断（找论据）-> 做表达

对目标商家下发「开播理由BD工具」，撬动其表达意愿、进而牵引其开播

通过下发开播理由BD工具，实现商品快速创建能力，提升商家商品发布效率

\`\`\`mermaid
flowchart LR; A["用户填写商品信息"] --> B{"校验商品参数"} -->|有效| C["提交创建商品接口"] --> D{"请求是否成功"} -->|成功| E["刷新商品列表"] --> F["关闭弹窗"]; D -->|失败| G["提示错误信息"]; B -->|无效| H["提示参数错误"]
\`\`\`

## 1.3 项目目标和收益
目标和收益的表格...

# 二、需求概述
功能点表格...

# 三、需求详情
## 新增一个商品发布弹窗
type: new
related: NewModalButton,ItemNewModal
...

# 四、后端协作信息

禁止总接请求参数和响应参数等过于详细的前端信息，但需要提供接口相关的业务描述、业务约束、关键接口使用关系、接口与页面/功能的对应关系等，例如同一手机号不可重复注册、某个功能依赖哪些接口、某个接口被哪些业务流程使用；

## 4.1 接口与业务说明
| 接口名称 | 用途 | 对应页面/功能 |
| --- | --- | --- |
| createGoods | 创建商品 | 商品发布弹窗 |
| getGoodsList | 刷新商品列表 | 商品列表页 |

## 4.2 业务约束
- 同一商品编码不可重复创建；
- 商品发布前必须完成必填字段校验；
- 创建成功后需要立即刷新商品列表。

## 4.3 接口依赖关系
- 用户在商品发布弹窗提交表单后，先调用 createGoods；
- createGoods 成功后，再调用 getGoodsList 获取最新数据；
- createGoods 失败时，页面仅提示错误，不刷新列表。
\`\`\`
</requirement.md示例>`

export default {
    firstOfAll,
    requirementGuide
}