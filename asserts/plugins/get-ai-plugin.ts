import AIPlugin, { fileFormat, createMyBricksAIRequest } from '@mybricks/plugin-ai'

export type OnDownloadParams = {
  name: string
  content: string
  // 后续可扩展更多字段，如 mimeType、encoding 等
}

export type GetAiPluginOptions = {
  key: string
  getToken: () => Promise<string>
  /** VSCode 下由 extension 弹窗选择保存路径并写入文件；支持异步 */
  onDownload?: (params: OnDownloadParams) => void | Promise<void>
}

export default ({ key, getToken, onDownload }: GetAiPluginOptions) => {
  const requestMybricks = createMyBricksAIRequest({ getToken })
  return AIPlugin({
    isMutiCanvas: false,
    guidePrompt: `建议用大块的AI区域组件来完成，容器只需要做布局和AI区域间的间距使用，不允许拆分过细的AI区域组件。`,
    prompts: {
      systemAppendPrompts: systemAppendPromptsForAi(),
      prdExamplesPrompts: prdExamplesPrompts(),
      generatePageActionExamplesPrompts: generatePageActionExamplesPromptsForAi(),
    },
    key,
    createTemplates: {
      page: ({ title }) => {
        return {
          type: "normal",
          title: "页面",
          inputs: [
            {
              id: "open",
              title: "打开",
              schema: {
                type: "any",
              },
            },
          ],
        }
      }
    },
    onRequest: (params) => {
      return requestMybricks(params)
    },
    onDownload,
  })
}

function systemAppendPromptsForAi() {
  return `
<对于当前搭建有以下特殊上下文>
  <搭建画布信息>
    搭建画布的宽度一般建议在 1024 - 1920之间，所有元素的尺寸需要关注此信息，且尽可能自适应布局。
    
    搭建画布的宽度只是在MyBricks搭建时的画布宽度，实际运行时可能会更宽。
    
    搭建内容必须参考PC端网站进行设计，内容必须考虑左右排列的丰富度，以及以下PC的特性
      比如:
        1. 布局需要自适应画布宽度，实际运行的电脑宽度不固定；
        2. 宽度和间距配置的时候要注意画布的宽度，不要超出，也不要让内容间距太大；
  </搭建画布信息>

  <对于图片或原型>
    可能会存在明显异于UI的评论、标注信息，注意筛选后去除。
  </对于图片或原型>
</对于当前搭建有以下特殊上下文>
`
}

function prdExamplesPrompts() {

  return `
<example>
  <user_query>我要搭建一个京东首页</user_query>
  <assistant_response>
  好的，我来参考京东首页的内容实现一下，以下是需求分析规格说明书和组件选型的内容：
${fileFormat({
  content: `*概述*
本文档旨在规划一个功能丰富、营销氛围浓厚的综合性电商平台PC端首页，用于吸引用户、展示商品并引导消费。

*设计规范*
- *设计风格*：整体采用现代营销风，在按钮、文字上以现代简约为主，但是在色彩和内容密度上提供大量营销氛围。
- *色彩体系*：根据京东品牌风格和营销的特质，主色调采用品牌红 \`#E83A30\`，用于强调按钮、活动标签等；辅助色为浅灰色 \`#F2F2F2\` 用于背景，文字主色为 \`#333333\`。
- *字号规范*：正文字号 \`12px\`，标题根据层级在 \`16px-20px\` 之间。
- *间距与圆角*：模块间距统一为 \`16px\`，大部分无圆角，视情况配置圆角。

*设计亮点*
- *丰富的促销内容区域*：在核心内容区设计了左中右三栏布局，提升信息密度，在中间还设计了大量的促销模块。
- *黑金尊贵感*：个人信息卡片采用黑金配色，突出PLUS会员的尊贵感。
- *丰富的商品卡片*：商品卡片信息丰富，包含图片、标题、价格、划线价、标签（百亿补贴）、优惠券等多维度信息，提升用户购买欲望。

*内容*
*顶部灰色快捷导航栏*
- *功能*：提供地理位置、用户信息及常用功能快捷入口。
- *视觉*：这是一个PC页面的顶部通栏，背景为 \`#f2f2f2\` 浅灰色，高度约 \`30px\`，可以尽量放在更多的内容。
- *内容*：
  - 左侧：一个定位图标 + “北京”文字链接，旁边是用户昵称文本，例如 “Hi, a-ming”。
  - 右侧：多个横向排列的文本链接，如“我的订单”、“我的京东”、“企业采购”，以及一个带图标的“购物车”入口。
*主头部区域（Logo与搜索）*
- *功能*：网站核心的品牌标识和全局搜索功能。
- *视觉*：位于快捷导航栏下方，以品牌红色为主，视觉突出，高度约 \`100px\`。
- *内容*：
  - 左侧：京东的红色Logo图片。
  - 中间：一个搜索栏。包含一个带有放大镜图标的“搜索”按钮，输入框内有灰色的提示文字，如“搜你想搜”。
  - 右侧：一个风格现代的“我的购物车”按钮，带有购物车图标和数量角标。
*核心内容区*
- *功能*：页面的核心，聚合了左侧分类导航、主要营销活动和右侧个人信息。
- *视觉*：经典的左中右三栏布局，占据页面主要空间。
- *内容*：
  - **左侧（商品分类）**：一个纵向的菜单，包含 “家用电器”、“手机通讯”、“电脑办公” 等多个文本分类。鼠标悬停时会弹出更详细的子分类面板。
  - **中间（轮播与频道）**：2*2的网格，按序号来看是一个活动轮播、京东秒杀、百亿补贴、9.9包邮。
    - 活动轮播：一个轮播图区域，展示当前的主要促销活动，图片自动轮播并可手动切换；
    - 京东秒杀：一个秒杀氛围卡片，包含倒计时和1*2的商品展示入口；
    - 百亿补贴：一个百亿补贴氛围卡片，包含1*2的商品展示入口，商品循环列表，每个商品还有“已补贴XX元字样”；
    - 9.9包邮：一个9.9包邮氛围卡片，包含1*2的商品展示入口，商品循环列表，有一些生鲜商品的绿色氛围。
  - **右侧（个人信息 + 服务入口）**：一个个人信息卡片，包含用户头像、昵称、“欢迎回来！”问候语。下方是循环多个2*3的图文结合的快捷服务入口列表（如“话费”、“机票”），整体具有**黑金质感**以体现PLUS会员的尊贵感。
*为你推荐（瀑布流商品列表）*
- *功能*：基于用户偏好推荐商品，无限滚动加载。
- *视觉*：一个两列或多列的、不等高的商品卡片陈列（瀑布流效果）。
- *内容*：
  - 顶部：一个标题“为你推荐”，右侧有一个“换一批”按钮。
  - 下方：无限滚动的商品信息网格。每个商品卡片包含：商品图片、多行截断的标题、优惠券标签（如“满199减100”）、红色价格、店铺名称链接和“看相似”按钮。

*初始化数据*
- 当前地理位置
- 常用功能列表
- 用户昵称
- 导航菜单
- 轮播的图片、连接等信息
- 秒杀商品卡片的数据
- 百亿补贴卡片的数据
- 9.9包邮卡片的数据
- 用户个人信息卡片数据
- 推荐商品列表数据
- 推荐商品列表下各商品的数据

*参考风格*
京东(JD.com)、淘宝(Taobao.com) PC端首页。`,
  fileName: '京东首页需求文档.md',
  type: 'md'
})}

推荐采用以下组件进行搭建：
${fileFormat({
    content: `[
  {
    "namespace": "mybricks.somelib.icon"
  },
  {
    "namespace": "mybricks.somelib.text"
  },
  {
    "namespace": "mybricks.somelib.button"
  },
  {
    "namespace": "mybricks.somelib.list"
  },
  {
    "namespace": "mybricks.somelib.image"
  }
]`,
    fileName: 'XX页面所需要的组件信息.json'
  })}
  </assistant_response>
</example>
<example>
  <user_query>大学官网用下面这一份信息</user_query>
  <assistant_response>
  好的，我来为你生成一个现代风格的大学校园官网的需求文档和组件选型。
${fileFormat({
    content: `# 概述
设计一个现代风格的大学校园PC端的官网，展示学校的综合实力、学术氛围和校园文化。整体采用扁平化设计，注重信息层次和视觉冲击力。

# 设计规范
- *设计风格*：现代扁平化，注重科技感和活力，采用渐变色和毛玻璃效果卡片提升质感。
- *色彩体系*：根据风格和用户要求，主色调采用科技蓝作为主色，辅以白色和浅灰色作为背景，文字主色为深灰色。
- *字号规范*：正文字号 \`14px-16px\`，标题根据层级在 \`32px-48px\` 之间。
- *间距与圆角*：模块间距统一为 \`24px-40px\`，区块间距为 \`80px-120px\`，圆角视情况配置。

# 设计亮点
- *现代感*：根据设计风格，采用扁平化设计、渐变背景、毛玻璃效果、微动效，突出科技感和活力；
- *内容丰富*：
  - 合理利用空间，通过卡片、图标、数据可视化等方式提升信息展示效率；
  - 数据可视化展示学校实力，用图标和数字增强说服力
  - 不对称布局增加视觉趣味性和内容利用率
- **响应式考虑**：画布宽度\`1024px\`，所有元素不超出画布，采用灵活布局适配；

我们从上到下、从左到右来分析UI结构：

## 顶部导航栏
**功能**：提供全站导航和快速入口，展示学校标识
**视觉**：固定在页面顶部，背景为**半透明毛玻璃效果**，滚动后变为纯色，宽度\`1024px\`无左右间距
- **左侧**：学校logo（\`60*60px\`）+ 学校中英文名称（中文\`18px\`粗体、英文\`12px\`细体）
- **中间**：横向导航菜单，包含“首页”、“学校概况”、“院系专业”等文本入口（字号\`14px\`、间距\`32px\`）
- **右侧**：一个搜索图标按钮 + 一个语言切换文本（中/EN）+ 一个登录入口按钮
## 首屏英雄区（Hero Section）
**功能**：第一视觉冲击，展示学校形象和核心价值
**视觉**：占据首屏高度（\`600-800px\`），采用**渐变背景**（深蓝到紫色）+ 校园实景图叠加，内容居中
- **主标题**：**双色渐变**标题（\`48px\`超粗体），展示学校slogan
- **副标题**：一句话介绍（\`18px\`），如"一所具有百年历史的综合性研究型大学"
- **数据标签**：3-4个浮动的数据卡片，以特定位置悬浮在背景上，展示"QS排名Top 50"、"95%就业率"等亮点，采用**半透明背景 + 渐变边框**
- **行动按钮组**：两个按钮，主按钮（**渐变色填充**）+ 次按钮（**描边样式**），按钮均带图标
- **滚动提示**：底部居中有一个带**动画效果**的向下箭头，提示用户继续浏览
## 学校概况区
**功能**：简要介绍学校历史、定位和优势
**视觉**：左右不对称布局，左侧占40%，右侧占60%，区块上下间距\`100px\`
- **区块标题**：居中，包含主标题"学校概况"（\`36px\`粗体）+ 英文副标题"About Us"（\`14px\`细体灰色）
- **左侧内容**：
  - 一张历史图片（固定宽度\`360px\`、高度\`480px\`、圆角\`12px\`、带**阴影**）
  - 图片右下角悬浮一个小标签："始建于1920年"
- **右侧内容**：
  - 学校介绍文本（\`16px\`行高\`1.8\`，约200字），重点文字用主题色高亮
  - 介绍文本下方是一个包含四个横向均分卡片的区域，每个卡片包含：顶部的彩色图标（\`32*32px\`）、数据数字（\`48px\`粗体、主题色）、数据说明（\`14px\`灰色）。例如“办学历史120年”、“校园面积3000亩”等。
  - 最底部是一个"了解更多"的链接按钮（带右箭头图标）
## 院系专业区
**功能**：展示学科覆盖和王牌专业
**视觉**：标题 + 可切换的横向滑动卡片列表，区块间距\`100px\`
- **区块标题**：同上格式，"院系专业"+"Faculties & Programs"
- **分类标签**：一个可切换的标签栏，包含"全部"、"理工科"、"人文社科"等选项
- **学院卡片列表**：一个可横向滚动的循环列表，展示1行4个卡片。每个卡片包含：
  - 学院图片（宽\`240px\`高\`180px\`、圆角\`8px\`）
  - 学院名称（\`20px\`粗体）
  - 位于右上角的王牌标签（红色背景，文字“国家重点学科”）
  - 图标+数字信息：如教师数量、学生数量
  - 底部"了解详情"文本链接（带右箭头）
- **查看更多**：底部有一个居中的“查看更多”按钮
## 科学研究区
**功能**：展示科研实力和成果
**视觉**：左右不对称布局，左侧占60%，右侧占40%，区块间距\`100px\`
- **区块标题**：同上格式，"科学研究"+"Scientific Research"
- **左侧内容**：
  - 一个两行两列的循环网格列表，展示4个科研成果图片（每个宽\`280px\`高\`200px\`、圆角\`8px\`、带**鼠标悬停放大效果**）
  - 图片上叠加标题文字（半透明黑色背景、白色文字），如"国家重点实验室"
- **右侧内容**：
  - 科研介绍文本（\`16px\`、2-3段）
  - 三个竖向排列的数据卡片循环列表，采用**渐变边框**样式，包含图标和数字，如“国家重点实验室数量：8个”
  - 底部"科研成果展示"按钮
## 校园生活区
**功能**：展示丰富的校园文化和学生活动
**视觉**：采用三列、不等高的图片陈列（**瀑布流效果**），区块间距\`100px\`
- **区块标题**：同上格式，"校园生活"+"Campus Life"
- **介绍文本**：居中，简短介绍（\`16px\`、1-2行）
- **图片网格**：展示8-10张校园生活图片，图片上叠加分类标签（"体育活动"、"社团文化"等），**鼠标悬停时图片放大并显示详细说明文字**。
## 新闻动态区
**功能**：展示学校最新资讯和动态
**视觉**：左右布局，左侧为重点新闻，右侧为新闻列表，区块间距\`100px\`
- **区块标题**：同上格式，"新闻动态"+"News & Events"
- **左侧内容**（宽度约\`600px\`）：
  - 一个大图新闻卡片，包含新闻标题（\`24px\`粗体、2行截断）、摘要（\`14px\`灰色、3行截断）、发布时间、阅读量。
- **右侧内容**（宽度约\`380px\`）：
  - 一个包含4-5条新闻的循环列表，每条包含：小缩略图（\`80*80px\`）、标题（\`16px\`）、发布时间。
  - 底部"查看全部新闻"文本链接
## 页脚区
**功能**：提供详细信息、快速导航和联系方式
**视觉**：深色背景（深蓝或深灰\`#1a1a2e\`）、左右无间距、上下内边距\`60px\`
- **上半部分**：内容分为四列均分
  - **第1栏**：学校logo + 简介（白色80%透明度文字、\`14px\`）
  - **第2栏**：快速链接列表
  - **第3栏**：在线服务列表
  - **第4栏**：联系我们信息及社交媒体图标（微信、微博等）
- **分隔线**：一条浅灰色\`1px\`的线
- **下半部分**：居中，包含版权信息、备案号等（\`12px\`灰色）

# 参考风格
现代的大学官网设计风格，如清华大学、麻省理工学院等。
`,
    fileName: '现代风格大学校园官网需求文档.md',
    type: 'md'
})}

推荐采用以下组件进行搭建：
${fileFormat({
    content: `[
  {
    "namespace": "mybricks.somelib.icon"
  },
  {
    "namespace": "mybricks.somelib.text"
  },
  {
    "namespace": "mybricks.somelib.button"
  },
  {
    "namespace": "mybricks.somelib.list"
  },
  {
    "namespace": "mybricks.somelib.image"
  }
]`,
    fileName: 'XX页面所需要的组件信息.json'
  })}
  </assistant_response>
</example>
<example>
  <user_query>我要做一个小说官网，风格紧凑</user_query>
  <assistant_response>
好的，我来为你生成一个典型的PC端小说官网的需求分析规格说明书和组件选型建议。整体风格强调信息密度高、排版紧凑、交互直接，符合主流网络文学平台（如起点中文网、纵横中文网）的设计习惯。

${fileFormat({
  content: `# 概述
本文档用于规划一个高信息密度、强功能导向的PC端小说阅读平台首页，目标是快速引导用户发现新书、追更热门作品，并提升点击转化率。

# 设计规范
- *设计风格*：**极致紧凑型布局**，以文字内容为核心，几乎不留白，模块边界清晰但无装饰性圆角。
- *色彩体系*：
  - 主背景色：纯白 \`#FFFFFF\`
  - 文字主色：深灰 \`#333333\`（正文）、黑色 \`#000000\`（标题）
  - 强调色：红色 \`#C00000\`（用于“新书”、“限免”、“更新”等标签）
  - 链接色：蓝色 \`#0066CC\`
- *字号规范*：
  - 页面标题：\`20px\` 粗体
  - 榜单/分类标题：\`14px\` 粗体
  - 小说标题：\`16px\` 常规
  - 作者/简介/状态：\`12px\`
- *间距与圆角*：
  - 模块内元素垂直间距仅 \`8px\`，模块间间距约 \`16px\`
  - **所有按钮、卡片、输入框均无圆角（**
  - 表格、列表采用细线分割（\`1px solid #eee\`）

# 设计亮点
- **高密度信息展示**：首页塞入排行榜、分类导航、新书推荐、限免专区、连载更新等多个模块，最大化利用屏幕空间。
- **强引导性标签系统**：大量使用“新”、“热”、“限免”、“完本”等红色/绿色标签，刺激点击。
- **表格化小说列表**：采用类Excel表格形式展示小说信息（含封面缩略图、书名、作者、状态、字数、更新时间），便于快速浏览。
- **弱装饰、纯功能导向**：去除一切非必要视觉元素（如阴影、渐变、动效），聚焦内容本身。

# 内容结构

## 顶部通栏
- 背景：白色
- 左侧：网站Logo（文字“小说网”+ slogan“百万好书，免费读”）
- 中间：主导航菜单（横向排列）：“首页”、“男生频道”、“女生频道”、“排行榜”、“完本专区”、“限免专区”
- 右侧：登录/注册入口 + “我的书架”链接

## 搜索与公告区
- 上半部：一个宽搜索框（无圆角），占满宽度，placeholder 为“书名 / 作者 / 关键词”
- 下半部：滚动公告条（红色背景 \`#FFF0F0\`，文字红色），如“《XXX》今日限免！”

## 主内容区（三栏布局：左窄 + 中宽 + 右窄）

### 左侧栏
- **分类导航**：垂直列表，无间距，每项带“>”箭头，如“玄幻”、“都市”、“言情”、“科幻”等
- **热门标签**：一行横向标签（“免费”、“完本”、“新书”、“VIP”），点击可筛选

### 中间主区
- **轮播横幅**（可选）：仅一张静态广告图，高度 90px，无自动播放
- **榜单模块**（多个并列）：
  - 每个榜单标题如“24小时热销榜”、“新书潜力榜”，右侧有“更多 >”链接
  - 榜单内容为编号 + 书名 + 作者（12px）的循环列表，共10行，无图片
- **新书推荐**：
  - 标题“最新上架”
  - 采用 2x3 循环网格列表，每个单元包含：
    - 左侧：60x80 小说封面（无圆角）
    - 右侧：书名（16px 蓝色链接）、作者（12px 灰色）、状态（“连载中”绿色标签）、简介（12px 截断两行）
- **连载更新**：
  - 表格形式，列包括：封面、书名、最新章节、更新时间
  - 每行高度仅 32px，紧凑排列

### 右侧栏
- **限免专区**：
  - 红底白字标题“今日限免”
  - 列出3本限免小说，每本含封面（60x80）、书名（红色）、“立即阅读”按钮（红色边框，无填充）
- **人气作家**：
  - 头像（40x40）+ 作家名 + 代表作（12px）
- **下载APP提示**：
  - 简单文字：“手机看书更方便，扫码下载APP”

## 页脚（简单信息）
- 背景：浅灰 \`#F5F5F5\`
- 内容：版权信息、ICP备案号、友情链接（“关于我们”、“联系我们”、“广告服务”）

# 参考风格
起点中文网、纵横中文网、17K小说网等传统PC端小说平台。
`,
  fileName: 'PC端小说官网需求文档.md',
  type: 'md'
})}

推荐采用以下组件进行搭建：
${fileFormat({
  content: `[
  {
    "namespace": "mybricks.somelib.text"
  },
  {
    "namespace": "mybricks.somelib.image"
  },
  {
    "namespace": "mybricks.somelib.list"
  },
  {
    "namespace": "mybricks.somelib.input"
  },
  {
    "namespace": "mybricks.somelib.button"
  }
]`,
  fileName: '小说官网页面所需要的组件信息.json'
})}
  </assistant_response>
</example>
<example>
  <user_query>还原这个图片/设计稿</user_query>
  <assistant_response>
好的，我来为你还原这个图片中的内容。整体是一个中后台的查询表单+表格的审批页面。

${fileFormat({
  content: `# 概述
还原用户图片中的UI内容。

# 内容结构
- 顶部查询表单，包含发起人搜索框、部门下拉框、请假类型下拉框的查询，同时包含查询和取消两个按钮；
- 中间为表格，表格包含开始时间、结束时间、状态、请假天数、还有审批和取消的操作列。
`,
  fileName: '还原审批页面文档.md',
  type: 'md'
})}

推荐采用以下组件进行搭建：
${fileFormat({
  content: `[
  {
    "namespace": "mybricks.somelib.text"
  },
  {
    "namespace": "mybricks.somelib.form"
  },
  {
    "namespace": "mybricks.somelib.table"
  },
  {
    "namespace": "mybricks.somelib.input"
  },
  {
    "namespace": "mybricks.somelib.button"
  }
]`,
  fileName: '还原审批页面所需要的组件信息.json'
})}
  </assistant_response>
</example>
`
}


function generatePageActionExamplesPromptsForAi() {
  return `
<example>
  <user_query>搭建一个知乎个人中心页面</user_query>
  <assistant_response>
    首先，必须根据页面内容设置一个数字类型的宽度和高度，必须为具体数字。
    其次，必须对页面布局设置一个合理的布局。
    然后
    基于用户当前的选择上下文，我们来实现一个知乎个人中心页面，思考过程如下：
    1. 搭建页面时一般用从上到下的搭建方式，我们推荐在页面最外层设置为flex的垂直布局，这样好调整位置；
    2. 将页面从上到下分成顶部信息、个人资料、核心内容三个区域来拆分。

    ${fileFormat({
      content: `["_root_",":root","setLayout",{"height": 820,"width": 1440}]
      ["_root_",":root","doConfig",{"path":"root/标题","value":"个人中心页面框架"}]
      ["_root_",":root","doConfig",{"path":"root/布局","value":{"display":"flex","flexDirection":"column","alignItems":"center"}}]
      ["_root_",":root","doConfig",{"path":"root/样式","style":{"background":"#F5F5F5"}}]
      ["_root_","_rootSlot_","addChild",{"title":"顶部导航","ns":"some.ai-mix","comId":"u_top32","layout":{"width":"100%","height":80},"configs":[{"path":"常规/需求文档","value":"# 顶部导航区域 背景和间距：背景白色，无间距。 内容：包含左侧的菜单和右侧的头像+消息入口"}]}]
      ["_root_","_rootSlot_","addChild",{"title":"个人资料","ns":"some.ai-mix","comId":"u_a2fer","layout":{"width":"100%","height":"fit-content","marginTop":12, "marginLeft":12, "marginRight":12},"configs":[{"path":"常规/需求文档","value":"# 个人资料区域 背景和间距：白色，间距无（外层已处理）。内容：包含头像、昵称、登记、性别等集合信息，左侧是头像、昵称、登记、性别等集合信息，右侧是编辑按钮"}]}]
      ["_root_","_rootSlot_","addChild",{"title":"核心内容","ns":"some.ai-mix","comId":"u_iiusd7","layout":{"width":"100%","height":"fit-content","marginTop":12, "marginLeft":12, "marginRight":12},"configs":[{"path":"常规/需求文档,"value":"#核心内容区域 背景和间距：白色，间距无（外层已处理）。 内容：左侧是最近浏览记录，展示浏览/点赞的帖子（有特殊的已点赞标记），右侧分为上下两个部分，上面是个人成就，勋章等荣誉信息，下方是帮助中心、举报中心、关于知乎等页脚入口"}]}]`,
      fileName: '生成个人中心页面操作步骤.json'
    })}

    注意：
    - flex布局优先使用fit-content来计算内容高度；
    - 三个区域有明显的卡片UI区分，所以间距在外层处理。
  </assistant_response>
</example>

<example>
  <user_query>还原设计稿效果</user_query>
  <assistant_response>
    好的，还原设计稿效果，首先必须根据页面内容设置一个数字类型的宽度和高度，必须为具体数字。
    其次，必须对页面布局设置一个合理的布局。
    然后
    基于用户当前的选择上下文，我们来实现一个知乎云服务器页面，思考过程如下：
    1. 整体结构为顶部导航栏 + 左侧菜单 + 右侧内容的经典布局，采用flex布局来实现；
    2. 将页面从上到下，从左到右分成多个部分；

    ${fileFormat({
      content: `["_root_",":root","setLayout",{"height": 1080, "width": 1600}]
      ["_root_",":root","doConfig",{"path":"root/布局","value":{"display":"flex","flexDirection":"column"}}]
      ["_root_","_rootSlot_","addChild",{"title":"顶部导航栏","ns":"some.ai-mix","comId":"u_top32","layout":{"width":"100%","height":60},"configs":[{"path":"常规/需求文档","value":"# 顶部导航栏 背景和间距：背景白色，无间距。 内容：包含左侧的菜单、中间搜索框、右侧的头像入口"}}]}]
      ["_root_, "_rootSlot_","addChild",{"title":"横向左右布局","ns": "some.container","comId":"u_2h32d","layout":{"width":"100%","height":"fit-content"},"configs":[{"path":"常规/布局","value":{"display":"flex", "flexDirection": "row", "justifyContent": "space-between", "alignItems": "center"}}]}]
      ["u_2h32d","content","addChild",{"title":"左侧菜单","ns":"some.ai-mix","comId":"u_leftMenu","layout":{"width":200,"height":"fit-content"},"configs":[{"path":"常规/需求文档","value":"# 左侧菜单 背景和间距：背景白色，无间距。 内容：包含左侧的菜单、中间搜索框、右侧的头像入口"}}]}]
      ["u_2h32d","content","addChild",{"title":"右侧核心内容","ns":"some.container","comId":"u_rightContent","layout":{"width":"auto","height":"fit-content", "marginLeft": 12, "marginRight": 12, "marginTop": 12, "marginBottom": 12},"configs":[{"path":"常规/布局","value":{"display":"flex", "flexDirection": "column"}}]}]
      ["u_rightContent", "content", "addChild",{"title":"指标卡片区","ns":"some.ai-mix","comId":"u_data","layout":{"width":"100%","height":"fit-content"},"configs":[{"path":"常规/需求文档","value":"# 指标卡片区 背景和间距：背景白色，无间距。 内容：从左到右包含四个指标卡，每个指标卡包含一个标题、一个数值、一个图标"}}]}]
      ["u_rightContent", "content", "addChild",{"title":"表格片区","ns":"some.ai-mix","comId":"u_table","layout":{"width":"100%","height":"fit-content", "mariginTop": 12},"configs":[{"path":"常规/需求文档","value":"# 表格片区 背景和间距：背景白色。 内容：包含一个服务器价格表格，表格包含多个列"}}]}]`,
      fileName: '还原云服务器页面操作步骤.json'
    })}

    注意：
    - flex布局优先使用fit-content来计算内容高度；
    - 布局用于提供布局和间距，让AI组件不用关心宏观间距和布局，只需要考虑自身即可；
      - 左右布局容器左侧为固定宽度，右侧为auto自适应宽度，这样更适合自适应页面宽度；
      - 核心内容包揽了间距，简化AI组件内部样式逻辑；
  </assistant_response>
</example>

<example>
  <user_query>添加一个两行三列的导航</user_query>
  <assistant_response>
    好的，两行三列，就是均分网格布局，考虑到导航往往是动态数据，我们一般使用列表 + 间距来实现。
    所以提供一个列表容器，添加一个宽度=100%的flex布局容器，将内容添加进去即可。
    
    首先，必须根据页面内容设置一个数字类型的宽度和高度，必须为具体数字。
    其次，必须对页面布局设置一个合理的布局。
    
    ${fileFormat({
      content: `["_root_",":root","setLayout",{"height": 360, "width": 520}]
      ["_root_",":root","doConfig",{"path":"root/标题","value":"两行三列的导航"}]
      ["_root_",":root","doConfig",{"path":"root/布局","value":{"display":"flex","flexDirection":"column","alignItems":"center"}}]
      ["_root_","_rootSlot_","addChild",{"title":"循环列表","ns":"some.list","comId":"u_list","layout":{"width":"100%","height":"fit-contennt","marginLeft":8,"marginRight":8},"configs":[{ "path": "常规/列间距", "value": 8 }]}]
      ["u_list","item","addChild",{"title":"Flex容器","ns":"some.container","comId":"u_iiusd7","enhance": true,"layout":{"width":"100%","height":200},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"row","justifyContent":"center", "alignItems":"center"}}]}]
      ["u_iiusd7","content","addChild",{"title":"导航1","ns":"some.icon","comId":"u_icon1","layout":{"width":120,"height":120,"marginTop":8},"configs":[{"path":"样式/文本","style":{"background":"#0000FF"}}]}]`,
      fileName: '两行三列导航操作步骤.json'
    })}

  注意：
    - 这个Flex容器很有可能后续提供点击事件，所以不允许添加ignore标记，同时他属于图文展示，可以添加enhance标记。
  </assistant_response>
</example>
`
}