export type OperateApiResultMetadata = {
  summary: string;
  rawResponse: any;
  reusedSummary: boolean;
  verified: boolean;
};

export type OperateApiResult = {
  output: string;
  metadata: OperateApiResultMetadata;
};

export function createVerifyFailResult(params: {
  summary: string;
  rawResponse: any;
  reusedSummary: boolean;
}): OperateApiResult {
  return {
    output: "接口同步完成，但校验未通过，请重试同步。",
    metadata: {
      summary: params.summary,
      rawResponse: params.rawResponse,
      reusedSummary: params.reusedSummary,
      verified: false,
    },
  };
}

export function createVerifySuccessResult(params: {
  output: string;
  summary: string;
  rawResponse: any;
  reusedSummary: boolean;
}): OperateApiResult {
  return {
    output: params.output,
    metadata: {
      summary: params.summary,
      rawResponse: params.rawResponse,
      reusedSummary: params.reusedSummary,
      verified: true,
    },
  };
}

export function createNoNeedSyncResult(): OperateApiResult {
  return {
    output: "前后端接口一致，无需操作接口。直接进行下一步操作。",
    metadata: {
      summary: "",
      rawResponse: [],
      reusedSummary: false,
      verified: true,
    },
  };
}

export function createSummaryFailedResult(): OperateApiResult {
  return {
    output: "未生成接口变更记录，请重试。",
    metadata: {
      summary: "",
      rawResponse: [],
      reusedSummary: false,
      verified: false,
    },
  };
}

export function createExecuteErrorResult(error: unknown): OperateApiResult {
  return {
    output: `接口同步失败，请重试：${error instanceof Error ? error.message : String(error)}`,
    metadata: {
      summary: "",
      rawResponse: [],
      reusedSummary: false,
      verified: false,
    },
  };
}
