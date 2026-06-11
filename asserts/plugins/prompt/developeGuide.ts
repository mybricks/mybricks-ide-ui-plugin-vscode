import { APP_CONFIG_CODE } from './example'

/**
 * 开发指南
 */
const firstOfAll = `- 开发宪章
> 严格基于 **Taro 4.x 跨端框架**，适配 **H5 + 全平台小程序** 多端场景，参考「开发指南」+「源代码」进行代码开发任务，必须遵循「最佳实践」和「设计规范」，在编写各类型文件时，按照「文件编写规范」完成代码任务；JSDoc 注释属于代码的一部分，需要在编写节点代码时同步维护；完成代码任务后，遵循「文档规范」同步 requirement.md。

- 总体规则
  - 功能：生产级别的功能性；
  - 细节：在每个细节都精心完善；
  - 响应式：保证合理统一的间距，以及支持宽度变化自适应的代码；
  - 画布宽度：414px；
  - 禁止使用 emoji；
- 拆分逻辑
  - 精准识别到底是页面还是弹窗，对其进行拆分，如果是页面，需要在\`app.config.ts\`中的pages进行配置，如果是tab页，需要同时在\`app.config.ts\`中的pages以及tabBar.list进行配置， 如果是弹窗，需要使用popupRef；
  - tab页判断原则，tabBar 代表「多入口并列切换」的导航结构，不是多页面应用的标配。判断标准：
    - 需要 tabBar：需求中明确出现多个平级主功能模块可以来回切换（如首页/我的），页面关系是「并列」而非「跳转」；
    - 不需要 tabBar：登录、注册、详情、功能流程等场景，即使包含多个页面，页面间是跳转关系，不是并列切换；
    - 如果用户明确表达了需要使用tab切换页面，即使是登录、注册等上述提到的不需要tabBar判断，也以用户需求为准；
  - 我们特别希望在设计态能够展示所有页面和弹窗，方便用户进行调试；`

/**
* 资源使用说明
*/
const assetsUsageSection = `- 对于图标：为了保证视觉的统一与专业性，我们的共识是统一使用图标组件，当图标组件无法表达对应的语义时考虑使用图片替代。目前提供的图标库如下
  - @nutui/icons-react-taro
  - 组件库没有合适的图标时，才使用 https://api.iconify.design/material-symbols/home.svg?color=%23ff0000&height=32，可配置图标库、图标、颜色、高度等参数，不要全局都使用
  - 禁止使用 emoji
- 对于图片：图片是传递信息与氛围的关键。我们建议根据其用途选择合适的来源：
  - https://ai.mybricks.world/image-search?term=searchWord&w=20&h=20，可以配置一个高质量的写实图片（比如摄影、人文等）；
  具体来说
  - 对于海报/写实/商品/图片等：我们建议使用高质量的写实图片；
  - 对于Logo：我们建议使用色块+文本占位；
  - 对于插画/装饰性图形：我们优先推荐使用简单的svg来占位，避免使用图片过于跳脱；`

/**
 * 架构说明
 */
const architectureSection = `\`\`\`
├─ app.config.ts          # 应用入口，app配置，有且仅有一个，必须写在根路径，文件名必须为app.config.ts
├─ app.tsx                # 应用渲染入口，有且仅有一个，必须写在根路径，文件名必须为app.tsx
├─ app.less               # 全局样式（项目唯一文件且必须）
├─ dataSource.ts          # 项目唯一文件，必须
├─ setup.ts               # 项目唯一文件，必须
├─ requirement.md         # 需求文档（又名prd、PRD，在最后写入）
├─ hooks                  # 可选，可复用的全局自定义 hooks 目录
|  ├── useXxx.ts          # 每个 hook 单独一个文件，文件名与 hook 同名
|  └── useYyy.ts
├─ pages
|  └── index
|     ├── index.tsx
|     ├── index.module.less
|     └── hooks           # 可选，该页面/组件的自定义 hooks 目录
|        ├── useXxx.ts    # 每个 hook 单独一个文件，文件名与 hook 同名
|        └── useYyy.ts
|  └── detail
|     ├── index.tsx
|     ├── index.module.less
└─ components             # 可复用公共组件目录，所有跨页面复用的组件统一存放
   └── card
      ├── index.tsx
      ├── index.module.less
      └── hooks
         └── useXxx.ts
\`\`\`

> 项目支持渐进式渲染，初始化项目时，建议将入口和公共文件先初始化好，再按照页面进行初始化。

#### 页面与组件的文件拆分
- app.config.ts：应用入口，有且仅有一个，且必须写在根路径的 \`app.config.ts\` 中；
- app.tsx：应用渲染入口，有且仅有一个，且必须写在根路径的 \`app.tsx\` 中；
- pages/xxx：页面，每个页面必须单独拆到**文件夹**中，例如 \`pages/index/index.tsx\`、\`pages/detail/index.tsx\`；
- 组件：公共可复用组件，所有能在多个页面中重复使用的功能组件，必须统一放在 components/ 目录下，每个组件独立创建文件夹存放；

> 拆分仅作为结构处理，建议的开发顺序是完成基础架构的代码、然后按页面维度一个一个完成需求。

#### tsx 文件编写规范
1. 必须使用 TypeScript，所有组件 props、state、函数参数和返回值都需要有明确的类型定义；
2. 组件状态和业务逻辑封装在组件内部，使用 useState、useReducer 等 React hooks 管理状态；
3. 当逻辑相对独立或较为复杂时，抽取到同级 \`hooks/\` 文件夹中，每个自定义 hook 单独一个文件（如 \`hooks/useXxx.ts\`）；
4. 禁止编写未实现的事件函数；
5. 对于浮层类组件，如弹窗、抽屉等，控制浮层的显示/打开/弹出/隐藏状态的变量使用 useState 维护，禁止设置为固定值；
6. 所有来自三方库的组件都必须带有 className 属性，值需语义化明确且唯一，无论是否需要样式，以便通过 CSS 选择器选中；
  - \`<View className={css.xxx}/>\`
7. 所有html元素都必须具有语义化的 className，无论是否需要样式，以便通过 CSS 选择器选中；
  - \`<View className={css.xxx}/>\`
8. 所有与样式相关的内容都要写在 less 文件中，避免在 tsx 中通过 style 编写；
9. 各类动效、动画等，尽量使用 css3 的方式在 less 中实现，不要为此引入任何的额外类库；
10. 禁止出现直接引用标签的写法，例如 \`<Tags[XX] property={'aa'}/>\`，正确的写法是先定义 \`const XX = Tag[XX]; <XX property={'aa'}/>\`；
11. 所有列表中的组件，必须通过 key 属性做唯一标识，不要使用 index 作为 key；

comRef 说明：
- comRef 是 MyBricks 提供的高阶函数，用于创建一个组件；

popupRef 说明：
- popupRef 是 MyBricks 提供的高阶函数，用于创建浮层类组件（弹窗、抽屉等）；

#### less 文件编写规范
1. 样式文件命名规则：格式为 \`*.module.less\` 的文件，编译时自动启用**CSS Module**模块化处理；格式为 \`*.less\` 的文件编译时不开启CSS Module；
2. 开发优先统一使用 \`*.module.less\` 格式编写样式，从根源避免全局样式污染、样式重叠冲突问题；
3. :frame 配置规则（仅页面和浮层类组件需要，普通组件不需要）：
   - 每个页面（page），必须配置 :frame { width }，宽度参考设计稿或 1440px（若无设计稿）；
   - 每个浮层类组件（由 popupRef 创建的组件），必须配置 :frame { width; height }，宽度与页面保持一致（同为 1440px 或设计稿宽度），高度在弹窗内容实际高度基础上额外增加 200～300px，以留出遮罩层空间（如内容约 400px 则配置 height: 650px）；
   - :frame 只控制画布尺寸，不影响运行时布局，必须放在所有 CSS 类之前；
   - :frame 只在首次创建页面或浮层类组件或者有重大 UI 重构时才需要重新估算；
   - 页面根组件用宽度100%适配:frame 宽度；
3. 在选择器中，多个单词之间使用驼峰方式，不能使用 - 连接；
4. 所有容器类的样式必须包含 \`position: relative\`；
5. 尽量不要用 calc 等复杂的计算；
6. 动效、动画等效果，尽量使用 css3 的方式实现，例如 transition、animation 等；
7. 不使用 :before、:after 等伪类选择器来实现 dom；

#### hooks/ 文件夹编写规范
当组件内存在相对独立、可复用或逻辑复杂的逻辑时，将其抽取为自定义 hook，放在同级 \`hooks/\` 文件夹中，每个 hook 对应一个独立文件。

使用原则：
- hooks 以文件夹形式存放，目录名必须是 \`hooks\`，位于组件或页面同级；
- 每个 hook 单独一个文件，文件名与 hook 名相同（如 \`useXxx.ts\`），存放在 \`hooks/\` 目录下；
- 每个自定义 hook 以 \`use\` 开头命名；
- hook 应内部管理自己的副作用，不对外暴露命令式方法；把需要响应的数据作为参数传入 hook，hook 内部用 \`useEffect\` 监听并处理；
- 禁止把「何时初始化/何时更新」的控制权暴露给外部：
  - 错误：hook 暴露 \`setXxx\` / \`initXxx\` 方法，由外部在 \`useEffect\` 里手动调用；
  - 正确：把需要响应的数据作为参数传入 hook，hook 内部决定如何响应；
- 当多个组件需要共享逻辑时，提取到上层公共 \`hooks/\` 目录中；

#### 日志规范
项目中必须使用 mybricks 提供的 \`logger\` 工具打印日志，禁止使用 console.log / console.warn / console.error 等原生方法。

必须在以下所有场景中打印足量日志，确保运行时行为可追踪、可排查：
1. 用户交互事件：所有 onClick、onChange、onBlur 等事件触发时，打印 logger.info 记录操作行为及关键参数；
2. 数据请求：接口调用前打印 logger.info 记录请求参数，请求成功后打印 logger.info 记录返回数据摘要，请求失败时打印 logger.error 记录错误信息；
3. 状态变更：组件或 hook 中任何状态更新时，打印 logger.info 记录更新内容及关键参数；
4. 条件分支与异常：进入关键条件分支时打印 logger.info 说明走了哪个分支；try-catch 中 catch 块必须打印 logger.error 记录异常；
5. 路由跳转：导航跳转时打印 logger.info 记录目标路径；
6. 任何可能失败的操作（如数据解析、类型转换等）都需要用 try-catch 包裹，并在 catch 中使用 logger.error 打印错误详情；

日志格式要求：
- 日志消息应包含上下文前缀，便于定位来源，格式推荐：\`[组件名/方法名] 具体描述\`；
- 示例：\`logger.info('[UserList/fetchUsers] 开始请求用户列表', { page: 1 })\`；
- 错误日志必须携带 error 对象：\`logger.error('[loadData] 数据加载失败', error)\`；

重复结构处理：当一个区块内存在多个「结构相同、仅数据不同」的重复单元时，必须拆成「容器 + 单项」两层：
- 容器（comRef）：负责布局与数据遍历，用 map 渲染单项；
- 单项（comRef）：描述单条数据的 UI，通过 props 接收单条数据；
- 禁止在容器中直接内联重复的 JSX 块；

命名与实现：
- 命名：使用语义化 PascalCase，名称应直接反映其在页面中的位置与职责；
- 实现：每个独立区块写成 \`const 区块名 = comRef(...)\`；
- 区块独立性：父组件只负责布局与子区块挂载，状态和业务逻辑各自在组件内部或对应 hook 中管理；
`

/**
 * 开发示例
 */

const examplesSection = `
<example>
  <user_query>开发一个登录页面</user_query>
  <assistant_response>
  好的，这是一个空项目，我将为您从0开始开发登录页。
  
  首先使用init-project来快速生成代码文件，然后确认渲染情况，最后同步文档。
  ${APP_CONFIG_CODE}
  </assistant_response>
</example>
`

export default {
    firstOfAll,
    assetsUsageSection,
    architectureSection,
    examplesSection
}