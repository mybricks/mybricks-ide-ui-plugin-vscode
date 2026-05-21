import {
  buildOperateApiFingerprint,
  getOperateApiSummaryCache,
  setOperateApiSummaryCache,
  type OperateApiSummaryFiles,
} from "./summary-cache";

const OPERATE_API_SUBAGENT_SYSTEM = `你是一个专业的后端开发助手，能根据前端需求进行接口分析和变更。
你的任务是基于用户需求、当前项目上下文以及现有接口相关文件，整理一份可直接提供给后端接口服务使用的接口变更记录。

输出要求：
1. 只输出接口变更记录，不要输出额外解释；
2. 结合 \`scheme.ts\`、\`dataSource.ts\`、\`setup.ts\`、\`requirement.md\`，按以下结构输出：
3. 直接读取\`requirement.md\`中的 需求背景、需求概述、需求详情做为内容补充，按以下结构输出：

- 需求背景
- 需求概述
- 需求详情
- 业务规则
- 变更设计
  - 新增接口
  - 编辑接口
  - 删除接口

3. “业务规则”中需要明确关键约束，例如重复提交限制、调用顺序、状态限制、前置条件等；
4. “变更设计”中必须明确区分新增、编辑、删除；
5. 如果项目只是初始化完成，且此前从未进行过\`operate-api\`（接口同步）或者接口同步失败，则本次接口优先视为新增；

<example>
## 需求背景
<requirement.md中的需求背景>
<requirement.md中的需求背景/>

## 需求概述
<requirement.md中的需求概述>
<requirement.md中的需求概述/>

## 需求详情
<requirement.md中的需求详情>
<requirement.md中的需求详情/>

## 业务规则
- 同一订单号不可重复创建；
- 创建成功后需要刷新订单列表；
- 未完成必填校验时禁止提交。

## 变更设计
1.新增接口：
- \`POST createGoods\`
- \`GET getGoodsDetail\`

2.编辑接口：
- \`POST getGoodsList\` 增加筛选参数。

3.删除接口：
- 无。

</example>

`;

function buildSubAgentPrompt(userMessage: string) {
  return `<用户原始需求>
${userMessage}
</用户原始需求>

请输出一份接口变更记录，用于后续接口文档生成。`;
}

export async function summaryState(toolContext: any) {
  const parentUserMessage = toolContext.getUserMessage?.()?.message ?? "";

  const parentAgent = toolContext.getAgent();
  const subAgent = parentAgent.createSubAgent({
    type: "operate-api-summary",
    description: "整理接口变更记录",
    system: OPERATE_API_SUBAGENT_SYSTEM,
  });

  const prompt = buildSubAgentPrompt(parentUserMessage);
  await subAgent.requestAI({
    message: prompt,
    attachments: toolContext.getUserMessage?.()?.attachments,
  });

  const turns = subAgent.getTurns();
  const lastTurn = turns[turns.length - 1];
  const lastLLMIter = lastTurn?.iterations?.slice().reverse().find(iter => !("type" in iter));
  return (lastLLMIter as any)?.content ?? "";
}

export async function getOperateApiSummary(params: {
  fileId: string;
  filesObj: OperateApiSummaryFiles;
  toolContext: any;
}) {
  const { fileId, filesObj, toolContext } = params;
  const userMessage = toolContext.getUserMessage?.()?.message || "";
  const fingerprint = buildOperateApiFingerprint(filesObj, userMessage);
  const cachedSummary = getOperateApiSummaryCache(fileId, fingerprint);

  toolContext.emitProgress?.({
    stage: "pending",
    message: cachedSummary ? "正在复用上次接口变更记录" : "正在生成接口变更记录",
  });

  if (cachedSummary) {
    return {
      summary: cachedSummary,
      reusedSummary: true,
    };
  }

  const summary = await summaryState(toolContext);
  console.log('=====summary', summary)
  if (!summary) {
    return {
      summary: "",
      reusedSummary: false,
    };
  }

  setOperateApiSummaryCache(fileId, fingerprint, summary);
  return {
    summary,
    reusedSummary: false,
  };
}
