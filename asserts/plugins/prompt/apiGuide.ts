import { SETUP_CODE, DATA_SOURCE_CODE, SCHEME_MANUAL, SCHEME_CODE } from "./example"

const firstOfAll = `

### scheme.ts 文件规范
scheme做为\`dataSource.ts\`和\`setup.ts\`的指挥家

使用原则：
- 尚未通过 \`operate-api\` 同步，则SchemeItem[path]为("");

${SCHEME_MANUAL}

<使用用例>
${SCHEME_CODE}
<使用用例/>


#### dataSource.ts 文件规范

使用原则：
- 所有正式数据（接口请求、静态数据）必须维护在 \`dataSource.ts\` 文件中。
- 非必要情况禁止在做代码逻辑处理
- DataSource 基类：mybricks 提供，构造时对所有子类方法自动做 Proxy 拦截;
- 禁止编造接口 URL、自行猜测路径、或使用任何形式的模拟数据（hardcode 返回值、Math.random、setTimeout 假数据等）；

编写规范：
- 对于公共接口使用 this.axios.defaults.baseURL = "基础 URL" 请求方法中使用 this.axios.[method]("path")；
- 对于非公共接口使用 请求方法中使用 this.axios.[method]("baseURL"+"path")；
- 如果 \`scheme.ts\` 尚未通过 \`operate-api\` 同步，则 \`dataSource.ts\` 中对应方法只保留方法名和空方法体作为占位，等待接口同步完成后再补全；
- 通过继承 \`DataSource\` 基类并 \`export default new MyDatasource()\` 来声明数据源；
- 接口方法必须严格基于 \`scheme.ts\` 中已定义的接口来实现，this.axios 发请求（禁止 import axios）；

<使用用例>
${DATA_SOURCE_CODE}
<使用用例/>


### 环境声明（setup.ts）
\`setup.ts\` 用于声明多套运行环境，**必须包含 \`mock\` 环境（设计态自动激活）**，其余环境根据用户需求按需来实现。

一共需要关心 设计态 + 运行态（正式环境 + N套自定义环境）：
1. 搭建环境：使用 mock 定义，由于axios在设计态无法调用，我们需要劫持动态数据的接口以保证设计态的正常返回
2. 正式环境：使用 dataSource.ts 中定义的接口请求；
3. N套自定义环境：用户需要时声明，比如特殊环境和特殊测试场景；
4. 必须根据scheme中的生成的数据类型数据

比如下面的代码，虽然 dataSource.ts 有两个方法，但是对于mock环境来说，只需要增量劫持：
1. getConfig 返回的是静态数据，设计态可以展示，无需spy；
2. getUserById 在设计态无法请求真实接口，所以需要mock一个接口返回，保证设计态渲染；

<使用用例>
${SETUP_CODE}
<使用用例/>

#### spyOn 使用原则
- spyOn的有且只有一个使用方式，就是 \`mockReturn\`，不得使用任何其他不存在的方法；
- scheme.ts 中定义了接口的请求参数和响应参数，用户在 mock 时必须保证 mock 数据的结构与 scheme 中定义的一致，否则可能导致设计态无法正确渲染；
- mockReturn 返回的结构必须与 scheme.ts 中 response 定义的结构一致；
- \`spyOn(dataSource, 'method').mockReturn(value: Record<string, any>): Promise<value>\`：可以替换该单个方法的返回值，**value 必须为 对象**；
- 仅必要时使用，比如由于设计态无法请求真实接口，需要劫持axios接口调用，不要劫持静态数据方法；
- \`describe\` 回调里可以做任意副作用：操作 \`dataSource.axios.defaults\`、写 localStorage 等；
- **必须声明 \`mock\` 环境**（设计态自动激活）；`

export default {
    firstOfAll
}