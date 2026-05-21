import { renderOperateApiTool } from "./render";
import { checkState } from "./check-stage";
import { getOperateApiSummary } from "./summary-state";

import { syncState, formatFiles } from "./sync-stage";
import {
  createNoNeedSyncResult,
  createSummaryFailedResult,
  createVerifySuccessResult,
  type OperateApiResult,
} from "./result";

export const OPERATE_API_TOOL_NAME = "operate-api";

// [TODO] 临时获取后端AI需要的用户和项目参数
export const getOperateApiParams= () => {
  const urlParams = new URLSearchParams(window.location.search)
  const projectId = urlParams.get('projectId')
  return {
    projectId,
    userId: localStorage.getItem("userId"),
  }
}

export function createOperateApiTool(fileId: string) {
  return {
    name: OPERATE_API_TOOL_NAME,
    title: "同步接口",
    description:
      "根据当前用户需求先整理接口变更记录，根据当前用户需求请求后端服务，操作接口，保持前后端的一致性。",
    render: renderOperateApiTool,
    parameters: {
      type: "object",
      properties: {},
    },
    async execute(_params: any, toolContext: any): Promise<OperateApiResult> {
      try {
        const { projectId } = getOperateApiParams()
        const filesObj = formatFiles();

        if (!projectId) {
          throw new Error("请先配置项目ID")
        }

        toolContext.emitProgress?.({
          stage: "pending",
          message: "正在检查接口",
        });

        const check = await checkState(filesObj.apiScheme, fileId);
        if (check) {
          toolContext.emitProgress?.({
            stage: "success",
            message: "接口无需变更",
          });
          return createNoNeedSyncResult();
        }

        toolContext.emitProgress?.({
          stage: "pending",
          message: "正在收集接口所需的上下文信息",
        });

        const { summary, reusedSummary } = await getOperateApiSummary({
          fileId,
          filesObj,
          toolContext,
        });

        if (!summary) {
          return createSummaryFailedResult();
        }

        let progressMessage = reusedSummary ? "开始生成（复用上次变更记录）" : "开始生成";
        const progressiveItems: any[] = [];
        const emitPendingProgress = () => {
          toolContext.emitProgress?.({
            stage: "pending",
            message: progressMessage,
            items: [...progressiveItems],
          });
        };

        emitPendingProgress();

        const result = await syncState(fileId, summary, filesObj, {
          onThinking: (chunk: string) => {
            progressMessage = chunk;
            emitPendingProgress();
          },
          onItem: (item) => {
            progressiveItems.push(item);
            console.log("[operate-api:onItem]", {
              time: Date.now(),
              count: progressiveItems.length,
              item,
            });
            emitPendingProgress();
          },
        });
        console.log('=====result', result)
        if (!Array.isArray(result.rawResponse) || result.rawResponse.length === 0) {
          throw new Error("接口同步完成，但后端未返回有效接口数据，请重试");
        }

        toolContext.emitProgress?.({
          stage: "success",
          message: "接口同步成功",
        });

        return createVerifySuccessResult({
          output: result.output,
          summary,
          rawResponse: result.rawResponse,
          reusedSummary,
        });
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  };
}
