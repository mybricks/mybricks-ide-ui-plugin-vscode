import React from "react";
import { PendingCodeCard, CodeCard, FileIcon, type ToolRecord, type ApiListItem } from "./render/components";

function getApiList(tool: ToolRecord): ApiListItem[] {
  const rawResponse = tool.result?.metadata?.rawResponse;
  return Array.isArray(rawResponse) ? rawResponse : [];
}

function getPendingApiList(tool: ToolRecord): ApiListItem[] {
  return Array.isArray(tool.progress?.items) ? tool.progress.items : [];
}

export function renderOperateApiTool(tool: ToolRecord) {
  if (tool.status === "pending") {
    const baseTitle = tool.title || "同步接口";
    const progressTitle = tool?.progress?.message ? `${baseTitle}（${tool.progress.message}）` : baseTitle;

    return <PendingCodeCard tool={{ ...tool, progress: { ...tool.progress, items: getPendingApiList(tool) } }} icon={<FileIcon />} title={progressTitle} />;
  }

  return (
    <CodeCard
      tool={tool}
      title={tool.title || "同步接口"}
      apiList={getApiList(tool)}
    />
  );
}
