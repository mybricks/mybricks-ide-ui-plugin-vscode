module.exports.getUserRequireGuide = function getUserRequireGuide() {
  function fileFormat({ content, fileName }) {
    return `\`\`\`json\n${content}\n\`\`\`\n`
  }

  const prompt = `
<特别注意>
  - 如果附件中有图片，需要在搭建过程中作为重要的参考，要注意分辨设计稿（或者截图）或者用户绘制的线框图，对于前者、要求最大程度还原图片中的各项功能要素与视觉设计要素，总体要求考虑到功能一致完整与合理性、注意外观视觉美观大方、富有现代感.
</特别注意>

<当前画布根组件信息>

  comId:_root_
  
  <组件_root_的插槽说明>
    组件_root_有1个插槽:（当前布局为:smart布局）
    [
      {
        "id": "_rootSlot_",
        "title": "插槽"
      }
    ]
  </组件_root_的插槽说明>
  
  <组件_root_可配置的内容>
    当选中 :root(组件整体) 时：
    [
      {
        "path": "root/标题",
        "editType": "text",
        "description": "配置_root_组件的标题",
      },
      
  {
    "path": "root/布局",
    "editType": "layout",
    "description": "页面内组件的布局方式"
  },
  {
    "path": "root/样式",
    "editType": "styleNew",
    "description": "设置背景颜色及背景图片"
  }

    ]
  </组件_root_可配置的内容>
    

IMPORTANT: 生成UI的根组件ID必须使用此文档信息。
</当前画布根组件信息>

<如何搭建UI以及修改>
通过一系列的action来分步骤实现用户需求。

${fileFormat({
content: `[comId, target, type, params]`,
fileName: '操作步骤.json'
})}

<关于actions>
actions.json文件由多个action构成,每个 action 在结构上都严格遵循以下格式：[comId, target, type, params];
- comId 代表要操作的目标组件的id;
- target 指的是组件的整体或某个部分，以选择器的形式表示，注意当type=addChild时，target为插槽id;
- type action的类型，包括了 setLayout、doConfig、addChild、delete 几类动作;
- params 为不同type类型对应的参数;

综合而言，每个action的语义是：对某个组件(comId)的整体或某个部分(target)，执行某个动作(type)，并传入参数(params)。

注意：
  - 在返回多个步骤时，务必注意其逻辑顺序，例如有些action需要先完成，后续的action（可能受控于ifVisible,只有ifVislble返回true才能使用）才能进行；
  - 有些修改需要先完成整体、再进行局部的修改；

各action详细说明如下：

<setLayout>
  - 设置组件的布局和尺寸信息，params的格式以Typescript的形式说明如下：
    
  \`\`\`typescript
  /**
   * 宽高尺寸
   * number - 具体的px值
   * fit-content - 适应内容
   * 100% - 填充，仅允许100%，不允许其他百分比宽度
   * auto - 自动填充，等同于flex=1
   * 只能是三者其一，明确不允许使用其他属性，比如calc等方法
   */
  type Size = number | "fit-content" | "100%" | "auto"

  /** flex中子组件定位，可配置如下layout */
  type setLayout_flex_params = {
    width?: Size;
    height?: Size;
    /** 上外边距 */
    marginTop?: number;
    /** 右外边距 */
    marginRight?: number;
    /** 下外边距 */
    marginBottom?: number;
    /** 左外边距 */
    marginLeft?: number;
  }
  \`\`\`

  注意：
  - 1. 只有在flex布局中的组件，可以在layout中使用margin相关配置；

  \`\`\`typescript
  /** 对于flex布局的插槽，我们可以添加absolute定位的组件 */
  type setLayout_absolute_params = {
    position: 'absolute';
    width?: Size;
    height?: Size;
    /** 距离左侧 */
    left?: number;
    /** 距离右侧 */
    right?: number;
    /** 距离上方 */
    top?: number;
    /** 距离下方 */
    bottom?: number;
  }
  \`\`\`

  \`\`\`typescript
  /** 如果组件本身是fixed类型定位，可配置如下layout */
  type setLayout_fixed_params = {
    position: 'fixed';
    width?: Size;
    height?: Size;
    /** 距离左侧 */
    left?: number;
    /** 距离右侧 */
    right?: number;
    /** 距离上方 */
    top?: number;
    /** 距离下方 */
    bottom?: number;
  }
  \`\`\`
  
  例如，当用户要求将当前组件的宽度设置为200px，可以返回以下内容：
  ${fileFormat({
    content: `["u_ou1rs",":root","setLayout",{"width":200}]`,
    fileName: '样式配置步骤.json'
  })}
  
  注意：当需要修改布局和尺寸信息时，仅返回用户要求的内容即可，无需返回所有的布局和尺寸信息属性。
</setLayout>

<doConfig>
  - 配置组件，使用<组件可配置的内容/>的配置项，对组件的属性或样式进行配置；
  - 如果配置项的type在 <常见editType的使用 /> 中有说明，务必遵守其中的说明及注意事项；
  
  - params的格式以Typescript的形式说明如下：
  
  \`\`\`typescript
  //配置样式
  type configStyle_params = {
    path:string,//在<当前组件可配置的内容/>中对应的配置项path
    style: {
      [key: string]: propertyValue; //元素的内联样式对象，仅能配置style编辑器description中声明的属性，不要超出范围。
    }
  }
  
  //配置属性
  type configProperty_params = {
    path:string,//在<当前组件可配置的内容/>中对应的配置项path
    value: any//需要配置的value
  }
  \`\`\`
  
  例如：
  - 属性的配置：
  ${fileFormat({
    content: `["u_ou1rs",":root","doConfig",{"path":"常规/标题","value":"标题内容"}]`,
    fileName: '样式配置步骤.json'
  })}
  
  - 样式的配置：
  ${fileFormat({
    content: `["u_ou1rs",":root","doConfig",{"path":"常规/banner样式","style":{"backgroundColor":"red"}}]`,
    fileName: '样式配置步骤.json'
  })}
  
    注意：
    - 当需要修改组件的样式时，只允许修改style编辑器description中声明的属性；
    - 当需要修改组件的样式时，背景统一使用background,而非backgroundColor等属性；
</doConfig>

<addChild>
  - addChild代表向目标组件的插槽中添加UI组件，需要满足两个条件:
    1. 目标组件中目前有定义插槽，且已知插槽的id是什么；
    2. 被添加的组件只能使用 <允许添加的组件/> 中声明的*UI组件*；
  - params的格式以Typescript的形式说明如下：
  
  \`\`\`typescript
  type add_params = {
    title:string //被添加组件的标题
    ns:string //在 <允许添加的组件 /> 中声明的UI组件namespace
    comId:string // 新添加的组件5位uuid，禁止重复，在所有UI组件中唯一
    layout?: setLayout_flex_params ｜ setLayout_fixed_params ｜ setLayout_absolute_params //可选，添加组件时可以指定位置和尺寸信息
    configs?: Array<configStyle_params | configProperty_params> // 添加组件可以配置的信息
    // 渲染优化
    ignore?: boolean //可选，是否添加ignore标记
    enhance?: boolean //可选，是否添加enhance标记
  }
  \`\`\`
  
  例如：
  ${fileFormat({
    content: `["u_ou1rs","content","addChild",{"title":"添加的文本组件","ns":"namespace占位","comId":"u_iysd7"}]`,
    fileName: '添加文本组件步骤.json'
  })}

  ${fileFormat({
    content: `["u_ou1rs","content","addChild",{"title":"背景图","ns":"namespace占位","comId":"u_ko4sn","layout":{"width":"100%","height":200,"marginTop":8,"marginLeft":12,"marginRight":12},"configs":[{"path":"常规/图片地址","value":"https://ai.mybricks.world/image-search?term=风景"},{"path":"样式/图片","style":{"borderRadius":"8px"}}]}]`,
    fileName: '添加带配置属性的步骤.json'
  })}

  ${fileFormat({
    content: `["u_ou1rs","content","addChild",{"title":"添加的布局组件","ns":"namespace占位","comId":"u_nb5yg","ignore": true}]`,
    fileName: '添加带ignore标记的步骤.json'
  })}

  注意:
    - 新添加的组件ID必须使用5位唯一的字母数字组合，禁止重复，在所有UI组件中唯一；
</addChild>

<delete>
  - 删除组件

  例如，当用户要求删除组件u_o21rs，可以返回以下内容：
  ${fileFormat({
    content: `["u_o21rs",":root","delete"]`,
    fileName: '删除组件整体.json'
  })}
  注意：删除时，必须删除组件的整体，不能删除组件的某个部分，所以使用:root选择器。
</delete>

注意：actions文件每一行遵循 JSON 语法，禁止非法代码，禁止出现内容省略提示、单行注释、省略字符。
  - actions返回的内容格式需要一行一个action，每一个action需要压缩，不要包含缩进等多余的空白字符；
  - 禁止包含任何注释（包括单行//和多行/* */）
  - 禁止出现省略号(...)或任何占位符
  - 确保所有代码都是完整可执行的，不包含示例片段
  - 禁止使用{}、{{}}这类变量绑定语法，并不支持此语法
  - 禁止使用非法字符或特殊符号
  - 所有内容均为静态数据，禁止解构，禁止使用变量

注意：
  - 返回actions文件内容时，务必注意操作步骤的先后顺序；
    - 有些操作需要在前面操作完成后才能进行；
    - 有些操作需要在其他操作开启（布尔类型的配置项）后才能进行；
  - 禁止重复使用相同的action；
</关于actions>

<UI搭建原则>
界面只有两类基本要素:组件、以及组件的插槽，组件的插槽可以嵌套其他组件。

搭建只能使用「UI组件」，不可使用「逻辑计算组件」。

<组件的定位原则>
  组件的定位有三种方式：flex定位、fixed、absolute定位。

  **flex定位**
    - 组件会相对于所在的插槽进行定位；
    - 通过尺寸（width、height） + 外间距（margin）来进行定位；
    - flex布局下的组件不允许使用left、top、right、bottom等定位属性；
    
  **fixed定位**
    - 组件会相对于当前组件的插槽进行定位，且脱离文档流；
    - 通过尺寸（width、height） + 位置（left、top、right、bottom）来进行定位；
    - fixed定位的组件不允许使用margin；
  
    使用fixed定位的例子:
    ${fileFormat({
      content: `["_root_","_rootSlot_","addChild",{"title":"添加一个固定定位组件","comId":"u_fu3nr","ns":"组件","layout":{"position":"fixed","width":"100%","height":84,"bottom":0,"left":0},"configs":[]}]`,
      fileName: '添加一个fixed定位组件.json'
    })}

  在插槽的不同布局下，组件的定位由所在插槽的布局方式决定：
    - 在当前组件的插槽中，可以添加fixed定位的组件，禁止在其他插槽中添加fixed定位的组件；
    - 如果插槽是flex布局，则子组件主要使用flex定位，特殊情况下使用absolute定位；
</组件的定位原则>

<布局原则>
  插槽的布局(display=flex)指的是对于内部组件（仅对其直接子组件，对于子组件插槽中的子组件无影响)的布局约束:
  
  **flex布局**
  （基本等同于CSS3规范中的flex布局）插槽中的所有子组件通过宽高和margin进行布局。

  <辅助标记说明>
    在 addChild 操作中，可以通过对布局类组件添加辅助标记来指导最终的渲染和布局行为。这些标记是可选的，但合理使用可以极大提升UI的性能和美观度。目前支持以下标记：
    1. ignore（结构优化标记）
      作用：当一个容器（通常是布局组件）只用于排列其内部元素（如分栏、对齐），而本身不需要任何可见样式（无背景、无边框、无圆角）且不响应交互（如点击）时，可以添加 ignore=true 标记。系统在最终渲染时，可以将这个布局容器优化掉，减少不必要的嵌套层级。
      决策流程：（从上往下执行）
        - 检查父级：父组件是根组件 _root_ 吗？是，则 ignore=false；
        - 检查父级：父级是否为布局容器？不是，则 ignore=false；
        - 检查当前组件属性：组件本身是否配置了样式（背景色、边框、圆角、内间距等）？是，则 ignore=false；
        - 猜测当前组件意图：组件是否可能作为整体被点击（如一个卡片）？是，则 ignore=false；
        - 检查当前组件插槽：组件是否存在非flex布局的插槽？是，则 ignore=false；
        - 否则（即：它只是一个纯粹的透明容器，仅用于 flex 布局，且父级也是布局容器），ignore=true。

    2. enhance（布局优化标记）
      作用：当一个flex容器（通常是布局组件）需要进行布局优化时，即从flex布局优化成自由布局，可以添加 enhance=true 标记。
      决策流程：（从上往下执行）
        - 检查当前组件属性：组件是否配置了 ignore=true？是，则 enhance=false；
        - 检查当前组件插槽：组件是否不存在flex布局的插槽？是，则 enhance=false；
        - 最后检查是否属于图文信息排列展示容器，且配置了flex布局？是，则 enhance=true。

    例子：第一个布局组件仅承担布局功能，可以添加ignore标记；第二个布局组件承担样式功能，不能添加ignore标记，第二个组件里添加了一个居中的文本，判断为信息卡片，添加enhance标记。
      ${fileFormat({
        content: `["目标组件id","插槽id占位","addChild",{"title":"第一个布局","comId":"u_dk98v","ignore":true,"ns":"组件","layout":{"width":"100%","height":120},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"row","alignItems":"center"}}]}]
      ["目标组件id","插槽id占位","addChild",{"title":"第二个布局","comId":"u_sdj3k","enhance":true,"ns":"组件","layout":{"width":"100%","height":120},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"row","alignItems":"center"}},{"path":"样式/样式","style":{"background":"#FFFFFF"}}]}]
      ["u_sdj3k","插槽id占位","addChild",{"title":"文本","comId":"u_tn5ix","ns":"组件","layout":{"width":"fit-content","height":"fit-content"},"configs":[{"path":"常规/文本内容","value":"居中文本"}]}]
      `,
        fileName: '标记使用.json'
      })}
  </辅助标记说明>

  <布局使用示例>
    **flex布局**
      子组件通过嵌套来搭建，无需考虑子组件的宽度和高度。

      下面的例子使用flex实现左侧固定宽度，右侧自适应宽度布局，右侧宽度配置width=auto:
      ${fileFormat({
        content: `["目标组件id","插槽id占位","addChild",{"title":"添加一个布局组件","comId":"u_flex0","ns":"布局组件","layout":{"width":"100%","height":60},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"row","alignItems":"center"}}]}]
      ["u_flex0","插槽id占位","addChild",{"title":"左侧固定宽度组件","comId":"u_lf4x1","ns":"组件","layout":{"width":60,"height":40,"marginRight":8},"configs":[]}]
      ["u_flex0","插槽id占位","addChild",{"title":"右侧自适应组件","comId":"u_rfo1x","ns":"组件","layout":{"width":"auto","height":40},"configs":[]}]
      `,
        fileName: '左侧固定宽度+右侧自适应宽度.json'
      })}
      在上例中:
        - 声明布局编辑器的值，注意布局编辑器必须声明，其中flexDirection也必须声明，关注justifyContent效果，默认为flex-start；
        - 左侧组件使用固定宽度，右侧组件使用width=auto(效果等同于flex=1)实现自适应宽度；
        - 通过marginRight配置左侧组件与右侧组件的间距；
      
      
      下面的例子使用flex进行嵌套，来实现左侧图标+文本，右侧箭头的布局:
      ${fileFormat({
        content: `["目标组件id","插槽id占位","addChild",{"title":"添加一个布局组件","comId":"u_flex1","ns":"布局组件","layout":{"width":"100%","height":60},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"row","justifyContent":"space-between","alignItems":"center"}}]}]
      ["u_flex1","插槽id占位","addChild",{"title":"左侧布局组件","comId":"u_pl92s","ignore": true,"ns":"布局组件","layout":{"width":"fit-content","height":"fit-content"},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"row","alignItems":"center", "justifyContent": "flex-start"}}]}]
      ["u_pl92s","插槽id占位","addChild",{"title":"图标组件","comId":"u_i98js","ns":"图标组件","layout":{"width":24,"height":24,"marginRight":8},"configs":[]}]
      ["u_pl92s","插槽id占位","addChild",{"title":"文本组件","comId":"u_tsdo2","ns":"文本组件","layout":{"width":"100%","height":"fit-content"},"configs":[]}]
      ["u_flex1","插槽id占位","addChild",{"title":"箭头图标组件","comId":"u_ar762","ns":"图标组件","layout":{"width":24,"height":24},"configs":[]}]
      `,
        fileName: 'flex嵌套实现左右布局.json'
      })}
      在上例中:
        - 声明布局编辑器的值，注意布局编辑器必须声明，其中flexDirection也必须声明；
        - 使用嵌套布局来完成左侧多元素 + 右侧单元素的布局，默认justifyContent=flex-start，所以左侧布局无需设置；
        - 左侧的图标+文本使用嵌套布局实现，且添加ignore标记，表示仅承担布局功能；

      下面的例子使用flex实现垂直居中布局:
      ${fileFormat({
        content: `["目标组件id","插槽id占位","addChild",{"title":"添加一个布局组件","comId":"u_flex2","ns":"布局组件","layout":{"width":"100%","height":120},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"column","alignItems":"center"}}]}]
      ["u_flex2","插槽id占位","addChild",{"title":"子组件","comId":"u_child","ns":"组件","layout":{"width":80,"height":80},"configs":[]}]
      `,
        fileName: '垂直居中布局.json'
      })}
      在上例中:
        - 声明布局编辑器的值，注意布局编辑器必须声明，其中flexDirection声明成column；
        - 通过alignItems来实现子组件的垂直居中； 
      
      下面的例子使用flex进行横向左右均分布局，实现各占一半的效果:
      ${fileFormat({
        content: `["目标组件id","插槽id占位","addChild",{"title":"添加一个布局组件","comId":"u_flex3","ignore": true,"ns":"布局组件","layout":{"width":"100%","height":120},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"row","justifyContent":"space-between","alignItems":"center"}}]}]
      ["u_flex3","插槽id占位","addChild",{"title":"A组件","comId":"u_a321s","ns":"组件","layout":{"width":"auto","height":40,"marginRight":8},"configs":[]}]
      ["u_flex3","插槽id占位","addChild",{"title":"B组件","comId":"u_b321s","ns":"组件","layout":{"width":"auto","height":40},"configs":[]}]
      `,
        fileName: '左右各占一半布局.json'
      })}
      在上例中:
        - 为了实现各占一半，配置A组件和B组件的宽度都为自适应auto（效果等同于flex=1），实现各占一半的效果；
          - 注意：不允许配置百分比宽度；
        - 判断仅布局，添加ignore标记，优化搭建内容。
        - 通过marginRight配置左侧组件与右侧组件的间距；

      下面的例子使用flex进行横向均分或等分布局，实现一行N列的效果:
      ${fileFormat({
        content: `["目标组件id","插槽id占位","addChild",{"title":"添加一个布局组件","comId":"u_flex4","ignore": true,"ns":"布局组件","layout":{"width":"100%","height":120},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"row","justifyContent":"space-between","alignItems":"center"}}]}]
      ["u_flex4","插槽id占位","addChild",{"title":"A组件","comId":"u_aksi","ns":"组件","layout":{"width":40,"height":40},"configs":[]}]
      ["u_flex4","插槽id占位","addChild",{"title":"B组件","comId":"u_b293e","ns":"组件","layout":{"width":40,"height":40},"configs":[]}]
      ["u_flex4","插槽id占位","addChild",{"title":"C组件","comId":"u_csim2","ns":"组件","layout":{"width":40,"height":40},"configs":[]}]
      `,
        fileName: '一行N列布局.json'
      })}
      在上例中:
        - 声明布局编辑器的值，注意布局编辑器必须声明，其中flexDirection也必须声明；
        - 针对内容元素的尺寸，配置合理的高度，防止内容溢出；
        - 为了实现均分，保证卡片之间存在间距，配置卡片宽度和高度都为固定值
          - 注意：不允许配置百分比宽度；
        - 判断仅布局，添加ignore标记，优化搭建内容。
      
      下面的例子展示flex布局中负margin的妙用，通过负margin实现背景层+内容层重叠的效果：
      ${fileFormat({
        content: `["目标组件id","插槽id占位","addChild",{"title":"添加一个布局组件","comId":"u_flex6","ns":"布局组件","layout":{"width":"100%","height":"fit-content"},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"column"}}]}]
      ["u_flex6","插槽id占位","addChild",{"title":"背景层","comId":"u_asds6","ns":"组件","layout":{"width":"100%","height":60},"configs":[]}]
      ["u_flex6","插槽id占位","addChild",{"title":"内容层","comId":"u_csdt6","ns":"组件","layout":{"width":"100%","height":100, "marginTop": -30},"configs":[]}]
      `,
        fileName: '负margin实现背景层+内容层重叠.json'
      })}
      在上例中:
        - 声明布局编辑器的值，注意布局编辑器必须声明，其中flexDirection也必须声明；
        - 通过负margin实现背景层+内容层重叠的效果；

      特殊地，在flex布局中的元素还可以配置position=absolute，用于实现绝对定位效果:
      ${fileFormat({
        content: `["目标组件id","插槽id占位","addChild",{"title":"添加一个布局组件","comId":"u_flex5","ns":"布局组件","layout":{"width":"100%","height":200},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"row","alignItems":"center"}}]}]
      ["u_flex5","插槽id占位","addChild",{"title":"绝对定位组件","comId":"u_abs12","ns":"组件","layout":{"position":"absolute","width":100,"height":40,"top":20,"left":20},"configs":[]}]
      ["u_flex5","插槽id占位","addChild",{"title":"普通组件","comId":"u_nor12","ns":"组件","layout":{"width":80,"height":80},"configs":[]}]
      `,
        fileName: '绝对定位效果.json'
      })}
      在上例中:
        - 声明布局编辑器的值，注意布局编辑器必须声明，其中flexDirection也必须声明；
        - 通过layout中的属性，设置成绝对定位效果，在一些特殊的角标等场景下很有效果；
        
  </布局使用示例>

  <布局注意事项>
    - 布局相关组件在添加时必须配置布局编辑器的值，尤其需要配置flexDirection和justifyContent；
      - 对于flexDirection，必须配置，仅允许配置row或column；
    - 优先考虑fit-content，如果要使用固定宽高，必须考虑到固定宽高会不会溢出导出布局错乱的问题；
  <布局注意事项>
  
</布局原则>

<最佳实践>
  1.永远保证UI的美观以及和谐统一，在基础组件的使用上遵循美观统一原则；
  2.在搭建开始前，我们建议对每个组件进行全面评估，特别是思考是否需要 <辅助标记 />，这能极大提升后续维护性；
  3.在选用组件时，文本、图片、图标、按钮等基础组件拥有最高优先级；

  <关于美观>
    组件使用：
      - 对于文本：注意保持视觉的统一性，选用合适的文本大小粗细，同时尽量配置文本省略，防止文本换行导致效果不佳。
      - 对于图标：为了保证视觉的统一与专业性，我们的共识是统一使用图标组件。请避免使用 Emoji 或特殊字符，它们可能导致在不同设备上的显示差异。
      - 对于图片：图片是传递信息与氛围的关键。我们建议根据其用途选择合适的来源：
        - https://placehold.co/600x400/orange/ffffff?text=hello，可以配置一个橙色背景带白色hello文字的色块占位图片；
        - https://ai.mybricks.world/image-search?term=搜索词&w=宽&h=高，可以配置一个高质量的摄影图片；
        对于海报/写实图片：我们建议使用高质量的摄影图片；
        对于品牌/Logo：我们建议使用色块占位图片；
        对于插画/装饰性图形：我们优先推荐使用图标来点缀；如果确实需要图片，也可以使用色块占位图片，防止摄影图片过于跳脱；
    布局使用：一个组件的位置、尺寸、margin，永远需要参考其父容器。时刻牢记这一点，可以从根本上解决绝大多数的重叠与溢出问题。
    占位使用：如果某个区域当前无法实现，我们推荐使用一个与整体风格协调的「卡片+文本」作为占位符，并简要说明。这既保证了界面的完整性，也为后续开发留下了线索。
  </关于美观>

  <选用组件>
    1.对于文本、图片、图标、按钮等基础组件，任何情况下都可以优先使用；
    2. 对于重复性元素：当遇到相似元素重复出现时，我们的判断标准是：
      若内容是动态的（如用户列表），应选用列表类组件。
      若内容是静态的（如功能入口），布局组件（N行M列）是更高效的选择
  </选用组件>
</最佳实践>
</UI搭建原则>
</如何搭建UI以及修改>

<对于当前搭建有以下特殊上下文>
  <搭建画布信息>
    搭建画布的宽度一般建议在 1024 - 1920之间，所有元素的尺寸需要关注此信息，且尽可能自适应布局。
    
    搭建画布的宽度只是在MyBricks搭建时的画布宽度，实际运行时可能会更宽。
    
    搭建内容必须参考PC端网站进行设计，内容必须考虑左右排列的丰富度，以及以下PC的特性
      比如:
        1. 布局需要自适应画布宽度，实际运行的电脑宽度不固定；
        2. 宽度和间距配置的时候要注意画布的宽度，不要超出，也不要让内容间距太大；
        3. 页面可以配置backgroundColor；
  </搭建画布信息>

  <允许使用的图标>
  antd中的图标
  </允许使用的图标>

  <对于图片或原型>
    可能会存在明显异于UI的评论、标注信息，注意筛选后去除。
  </对于图片或原型>
</对于当前搭建有以下特殊上下文>
</对于项目环境的说明>

<生成UI思路>
按照以下步骤完成：
  1、总体分析，按照以下步骤进行：
    1）确定总体的功能；
    2）保持总体UI设计简洁大方、符合现代审美、富有设计感，重点注意：
       - 建立清晰的视觉层次：通过字体大小、粗细、颜色、间距建立信息层级；
       - 使用现代设计元素：渐变背景、圆角卡片、轻微阴影、毛玻璃效果等；
       - 保持设计统一性：统一圆角值、间距系统、色彩方案、字体层级；
       - 色彩和谐：使用协调的配色方案，确保对比度和可读性；
       - 细节精致：注意圆角、阴影、边框等细节，体现专业感和现代感；
    3) 如果需要还原附件图片中的视觉设计效果:
      特别关注整体的布局、定位、颜色、字体颜色、背景色、尺寸、间距、边框、圆角等UI信息，按照以下的流程还原参考图片：
      - 提取图片中的关键UI信息并总结；
      - 根据总结和图片将所有UI信息细节使用actions一比一还原出来，注意适配画布尺寸；
      - 忠于图片/设计稿进行搭建，而不是文字性的总结，文字总结会有歧义；
      - 注意每一个元素的以及邻近元素的位置，上下左右元素，以及子组件的布局方式，务必保证与设计稿对齐；

  2、选择合适的组件与插槽，留意（知识库有更新）的提示，注意使用的组件不要超出当前【知识库】的范围：
    1）按照自上而下、从左向右的方式分析形成组件方案以及采用的插槽；
    2）选用合理的布局；
  
  3、详细分析各个组件，按照以下要点展开：
    - 标题(title):组件的标题；
    - 布局(layout):组件的宽高与外间距信息，只能声明width、height、margin，不允许使用padding等属性；
    - 样式(styleAry):根据组件声明的css给出合理的设计实现；
    - 数据(data):根据【知识库】中该组件的data声明进行实现；

  4、返回搭建UI的actions操作步骤文件内容，注意：
    - 每一个action符合JSON规范，每一行为一个action
    - 禁止包含任何注释（包括单行//和多行/* */）
    - 禁止出现省略号(...)或任何占位符
    - 确保所有代码都是完整可执行的，不包含示例片段
    - 禁止使用非法字符或特殊符号
    - 所有内容均为静态数据，禁止解构，禁止使用变量

  5、最后，根据搭建UI的actions操作步骤文件内容，返回搭建初始化数据的actions操作步骤文件内容，注意：·
    - 每一个action符合JSON规范，每一行为一个action
    - 禁止包含任何注释（包括单行//和多行/* */）
    - 禁止出现省略号(...)或任何占位符
    - 确保所有代码都是完整可执行的，不包含示例片段
    - 禁止使用非法字符或特殊符号
    - 所有内容均为静态数据，禁止解构，禁止使用变量
</生成UI思路>

<生成UI限制>
生成UI必须从根组件_root_开始配置，以及从插槽_rootSlot_开始添加组件。
</生成UI限制>

<examples>
  <example>
    <user_query>搭建一个知乎个人中心页面</user_query>
    <assistant_response>
      首先，必须根据页面内容设置一个合适的页面高度和宽度。
      其次，必须对页面布局设置一个合理的布局。
      然后
      基于用户当前的选择上下文，我们来实现一个知乎个人中心页面，思考过程如下：
      1. 搭建页面时一般用从上到下的搭建方式，我们推荐在页面最外层设置为flex的垂直布局，这样好调整位置；
      2. 将页面从上到下分成顶部信息、个人资料、核心内容三个部分；
      3. 顶部导航固定到页面顶部，不设置左右间距，内容为左侧菜单 + 右侧头像和消息私信入口；
      4. 个人资料区域是一个左右布局，左侧是头像、昵称、登记、性别等集合信息，右侧是编辑按钮；
      5. 核心内容也是左右布局，左侧是最近浏览记录，展示浏览/点赞的帖子（有特殊的已点赞标记），右侧分为上下两个部分，上面是个人成就，勋章等荣誉信息，下方是帮助中心、举报中心、关于知乎等页脚入口；

      ${fileFormat({
        content: `["_root_",":root","setLayout",{"height": 820,"width": 1440}]
        ["_root_",":root","doConfig",{"path":"root/标题","value":"个人中心页面框架"}]
        ["_root_",":root","doConfig",{"path":"root/布局","value":{"display":"flex","flexDirection":"column","alignItems":"center"}}]
        ["_root_",":root","doConfig",{"path":"root/样式","style":{"background":"#F5F5F5"}}]
        ["_root_","_rootSlot_","addChild",{"title":"顶部导航","ns":"some.banner","comId":"u_top32","enhance":true,"layout":{"width":"100%","height":80,"marginTop":8,"marginLeft":12,"marginRight":12},"configs":[{"path":"常规/布局","value":{"display":"flex"}}]}]
        ["_root_","_rootSlot_","addChild",{"title":"个人资料","ns":"some.container","comId":"u_a2fer","enhance":true,"layout":{"width":"100%","height":"fit-content","marginLeft":8,"marginRight":8},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"row","justifyContent":"space-between","alignItems":"center"}}]}]
        ["u_a2fer", "content", "addChild",{"title":"头像","ns":"some.avatar","comId":"u_avat","layout":{"width":64,"height":64},"configs":[]}]
        ["u_a2fer", "content", "addChild",{"title":"用户信息","ns":"some.container","comId":"u_info4","ignore":true,"layout":{"width":"fit-content","height":"fit-content"},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"row","alignItems":"center"}}]}]
        ["_root_","_rootSlot_","addChild",{"title":"核心内容","ns":"some.container","comId":"u_iiusd7","enhance":true,"layout":{"width":"100%","height":200,"marginLeft":8,"marginRight":8},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"column"}}]}]
        ["u_iiusd7", "content", "addChild",{"title":"最近浏览","ns":"some.list","comId":"u_rev","layout":{"width":"100%","height":"fit-content"},"configs":[]}]
        ["u_iiusd7", "content", "addChild",{"title":"右侧容器","ns":"some.container","comId":"u_rcont","layout":{"width":"auto","height":"fit-content","marginTop":8},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"column"}}]}]
        ["u_rcont", "content", "addChild",{"title":"个人成就区域","ns":"some.container","comId":"u_achieveCont","enhance":true,"layout":{"width":"100%","height":"fit-content"},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"column"}}]}]
        ["u_rcont", "content", "addChild",{"title":"页脚区域","ns":"some.container","comId":"u_fcont","layout":{"width":"100%","height":"fit-content","marginTop":8},"configs":[{"path":"常规/布局","value":{"display":"flex","flexDirection":"column"}}]}]`,
        fileName: '生成个人中心页面操作步骤.json'
      })}

      注意：
      - 可以的话，flex布局容器尽量用fit-content来计算内容高度。
      - 对于重复数据，我们尽量使用循环类组件展示，而不是添加重复组件。
      - 用户信息布局组件的父组件为布局组件，且仅承担布局功能，不承担样式、点击功能，我们添加ignore标记来优化。
      - 顶部导航、个人资料、个人成就区域、页脚区域的flex容器组件属于图文信息卡片，我们添加了enhance标记，优化flex布局的体验。
    </assistant_response>
  </example>

  <example>
    <user_query>搭建一个云服务器管理中后台页面</user_query>
    <assistant_response>
      基于用户当前的需求，我们来实现一个云服务器管理中后台页面，思考过程如下：

      分析下布局，这是一个经典的顶部导航+中间内容（左侧菜单 + 右侧内容）+ 底部页脚的中后台页面。
      必须先确认_root_的情况，必须先配置 页面高度、宽度 和 设置布局为垂直布局，然后开始搭建。
      
      首先，用一个左右布局的容器，完成顶部导航的左右部分内容；
      然后是中间内容，这是一个典型的左侧固定宽度菜单 + 右侧自适应内容的布局，我们用直接用容器来实现
        - 添加一个垂直的容器布局，注意图片上内容有左右和上下的间距，配置margin；
        - 添加左侧菜单部分，使用一个固定宽度的容器，配置合理的marginRight间距；
          - 添加左侧内容...
        - 添加右侧内容部分，使用一个自适应宽度（width=auto）的容器；
          - 添加右侧内容...
      最后是底部页脚，配置一个纯色背景，同时添加一个居中的容器来放置各类页脚内容，包含（产品和定价、支持与服务、文档与社区、关注我们等等）。

      \`\`\`json file="actions.json"
      ["_root_",":root","setLayout",{"height": 1600,"width": 1440}]
      ["_root_",":root","doConfig",{"path":"root/布局","value":{"display":"flex", "flexDirection": "column"}}]
      ["_root_",":root","doConfig",{"path":"root/样式","style":{"background":"#f5f5f5"}}]
      ["_root_","_rootSlot_","addChild",{"title":"顶部导航","ns":"some.container","comId":"u_head","enhance": true,"layout":{"width":"100%","height":64},"configs":[{"path":"常规/布局","value":{"display":"flex", "justifyContent": "space-between", "alignItems": "center"}}]}]
      ["u_head","content","addChild",{"title":"左侧Logo容器","ns":"some.container","comId":"u_logoc","enhance": true,"layout":{"width":160,"height":"fit-content","marginLeft":12},"configs":[{"path":"常规/布局","value":{"display":"flex", "alignItems": "center"}}]}]
      ["u_logoc","content","addChild",{"title":"Logo","ns":"some.image","comId":"u_logo","layout":{"width":32,"height":32},"configs":[]}]
      ["u_head","content","addChild",{"title":"右侧内容","ns":"some.container","comId":"u_headr","layout":{"width":"fit-content","height":"fit-content","marginRight":12},"configs":[]}]
      ["_root_","_rootSlot_","addChild",{"title":"中间内容","ns":"some.container","comId":"u_main","layout":{"width":"100%","height":1452,"marginTop":12,"marginBottom":12},"configs":[{"path":"常规/布局","value":{"display":"flex"}}]}]
      ...TODO...
      ["u_main","content","addChild",{"title":"左侧菜单","ns":"some.container","comId":"u_bar","layout":{"width":200,"height":"fit-content","marginRight":12},"configs":[{"path":"常规/布局","value":{"display":"flex", "flexDirection": "column"}}]}]
      ["u_main","content","addChild",{"title":"右侧内容","ns":"some.container","comId":"u_rcont","layout":{"width":"auto","height":"fit-content"},"configs":[{"path":"常规/布局","value":{"display":"flex", "flexDirection": "column"}}]}]
      ["_root_","_rootSlot_","addChild",{"title":"底部页脚","ns":"some.container","comId":"u_foot","enhance": true,"layout":{"width":"100%","height":80,"backgroundColor":"#222222"},"configs":[{"path":"常规/布局","value":{"display":"flex", "justifyContent": "center", "alignItems": "center"}}]}]
      ...TODO...
      \`\`\`
    
      在上述内容中：
      我们遵循了以下关键事项：
      流程：从「根组件高度和布局配置」-> 从上往下分区开始搭建内容 -> 。
      特别注意点：
        - 在中间内容中的布局中，右侧内容使用了自适应内容宽度的布局，宽度设置为auto，左侧固定，完成了自适应页面宽度的要求；
        - 「左侧菜单」和「右侧内容」，使用了关键性的自适应宽度，我们不能打上ignore标记，「左侧Logo容器」很有可能也会有点击时间，不能打上ignore标记；
        - 「顶部导航」、「左侧Logo容器」、「底部页脚」为信息展示的flex布局，且没有ignore标记，可以打上enhance标记；
        
    </assistant_response>
  </example>

  <example>
    <user_query>添加一个两行三列的导航</user_query>
    <assistant_response>
      好的，两行三列，就是均分网格布局，考虑到导航往往是动态数据，我们一般使用列表 + 间距来实现。
      所以提供一个列表容器，添加一个宽度=100%的flex布局容器，将内容添加进去即可。
      
      首先，必须根据页面内容设置一个合适的页面的高度和宽度。
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
</examples>
`;

  return prompt
}

module.exports.getComponentDocs = function getComponentDocs() {
  return `
# 组件使用文档
在以下所有组件中，特别的，pc.custom-container 是用于基础布局的组件，辅助标记也仅可以用于这些组件

<pc.custom-container文档>
   <title>自定义容器</title>
   <namespace>pc.custom-container</namespace>
   <type>UI组件</type>
<inputs>
  - 动态设置样式
    - inputId: setStyle
    - schema: {"type":"object","properties":{"background":{"type":"string","description":"背景色"}}}
  - 滚动到
    - inputId: scrollTo
    - schema: {"type":"number"}
</inputs>


<slots>
  - content（内容）
</slots>



  <使用说明>
  基础布局组件，可以用做布局组件和背景样式容器，必须使用。

slots插槽
content 内容

layout声明
width: 可配置，默认100%；
height: 可配置，当display=flex时，可以配置fit-content，其余为固定数值；

配置步骤
- 确认布局：确认当前布局信息，必须配置；
- 根据布局完成宽高配置：
  - 当声明display=flex时，layout属性宽高需遵循下方类型定义配置:
    width: number(固定px) | '100%' ｜ 'fit-content' | 'auto'
    height: number(固定px) | 'fit-content'
  - 当声明position=smart时，layout属性宽高需遵循下方类型定义配置:
    width: number(固定px) | '100%' | 'auto'
    height: number(固定px)
- 根据需求完成其它layout和样式配置；

  </使用说明>
    

  <可以使用的配置项>
    当选中 :root(组件整体) 时：


[
  {
    "path": "常规/布局",
    "editType": "layout",
    "description": "设置布局方式，包括智能布局、纵向排版、横向排版、自由布局",
    "options": []
  },
  {
    "path": "样式/默认/默认",
    "editType": "style",
    "description": "边框、圆角、背景、overflow、BoxShadow"
  },
  {
    "path": "样式/Hover/Hover",
    "editType": "style",
    "description": "边框、圆角、背景、BoxShadow"
  }
]
    
  </可以使用的配置项>

  <注意>
    可调整宽度
    可调整高度
  </注意>


  <初始数据>
    {
  "style": {},
  "slotStyle": {
    "position": "smart"
  },
  "legacyConfigStyle": {},
  "legacyStyle": {},
  "isAutoScroll": false,
  "direction": "vertical",
  "scrollTime": 2000,
  "eventBubble": false
}
  </初始数据>
    
</pc.custom-container文档>
    
<pc.text文档>
   <title>文本</title>
   <namespace>pc.text</namespace>
   <type>UI组件</type>
<inputs>
  - 内容
    - inputId: content
    - schema: {"type":"string"}
</inputs>


<slots>
无
</slots>



  <使用说明>
  文本组件，支持配置溢出策略

slots插槽
无

layout声明
width: 可配置，建议配置固定宽高
height: 可配置，建议配置fit-content


注意事项
- 注意配置fontSize同时要配置lineHeight，否则会无法正常展示；
- 尽量不用全黑的字体颜色，而是用柔和一些的颜色比如深灰色；
- 对于大部分（特别是动态内容）的文本，需要配置文本溢出，防止内容过多换行；
- 注意文本和其他组件之间要留有适量的边距（通过layout进行配置）；
  </使用说明>
    

  <可以使用的配置项>
    当选中 :root(组件整体) 时：


[
  {
    "bindWith": {
      "with": "data.content",
      "schema": {
        "type": "string"
      }
    },
    "path": "常规/内容",
    "editType": "textarea",
    "description": "设置文本的默认内容，也可以通过逻辑连线连接文本的输入项【内容】动态修改文本的内容",
    "options": {
      "locale": true
    }
  },
  {
    "path": "常规/文本溢出/省略",
    "editType": "switch",
    "description": "设置文本溢出换行时是否省略溢出部分"
  },
  {
    "ifVisible": "function ifVisible(_a) {\n          var data = _a.data;\n          return data.isEllipsis;\n        }",
    "path": "常规/最大显示行数",
    "editType": "InputNumber",
    "description": "设置文本的最大显示行数，开启【文本溢出/省略】配置项后才能配置",
    "options": [
      {
        "min": 1,
        "width": "100%"
      }
    ]
  },
  {
    "path": "常规/点击事件",
    "editType": "_Event",
    "description": "点击文本时触发，触发【点击】输出项事件",
    "outputId": "click"
  },
  {
    "bindWith": {
      "with": "data.outputContent",
      "schema": {
        "type": "string"
      }
    },
    "path": "常规/点击输出内容",
    "editType": "text",
    "description": "设置【点击】输出项事件输出的文本内容"
  },
  {
    "path": "样式/动态默认样式",
    "editType": "Switch",
    "description": "开启后，可以通过逻辑连线连接文本的输入项【设置默认样式】动态修改默认样式"
  },
  {
    "path": "样式/默认/默认",
    "editType": "style",
    "description": "字体、字号、颜色、粗细、行高、边框、圆角、背景"
  },
  {
    "path": "样式/Hover/Hover",
    "editType": "style",
    "description": "字体、字号、颜色、粗细、行高、边框、圆角、背景"
  }
]
    
  </可以使用的配置项>

  <注意>
    可调整宽度
    不可调整高度
  </注意>


  <初始数据>
    {
  "content": "文字",
  "outputContent": "",
  "align": "left",
  "isEllipsis": false,
  "ellipsis": {
    "rows": 1
  },
  "style": {},
  "useDynamicStyle": false,
  "useHoverStyle": true,
  "legacyConfigStyle": {}
}
  </初始数据>
    
</pc.text文档>
  `
}