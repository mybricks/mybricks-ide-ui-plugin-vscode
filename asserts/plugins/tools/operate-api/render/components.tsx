import React, { useState, useEffect } from "react";
// import css from "./index.less";
const css = {}

// ─── 类型 ────────────────────────────────────────────────────────────────────

export type ToolStatus = "pending" | "success" | "error";

export interface ToolRecord {
  name: string;
  title?: string;
  status: ToolStatus;
  args?: Record<string, any>;
  result?: { output?: string; [key: string]: any };
  progress?: { message?: string; items?: ApiListItem[] };
  execStartTime?: number;
  execEndTime?: number;
}

export interface ApiListItem {
  id?: string | number;
  cnName?: string;
  name?: string;
  method?: string;
  path?: string;
}

// ─── 图标 ────────────────────────────────────────────────────────────────────

const Loading = () => (
  <svg className={css.spin} width="11" height="11" viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true">
    <path d="M512 1024c-69.1 0-136.2-13.5-199.3-40.2C251.7 958 197 921 150 874c-47-47-84-101.7-109.8-162.7C13.5 648.2 0 581.1 0 512c0-19.9 16.1-36 36-36s36 16.1 36 36c0 59.4 11.6 117 34.6 171.3 22.2 52.4 53.9 99.5 94.3 139.9 40.4 40.4 87.5 72.2 139.9 94.3C395 940.4 452.6 952 512 952c59.4 0 117-11.6 171.3-34.6 52.4-22.2 99.5-53.9 139.9-94.3 40.4-40.4 72.2-87.5 94.3-139.9C940.4 629 952 571.4 952 512c0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.2C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3s-13.5 136.2-40.2 199.3C958 772.3 921 827 874 874c-47 47-101.8 83.9-162.7 109.7-63.1 26.8-130.2 40.3-199.3 40.3z" />
  </svg>
);

const SuccessIcon = () => (
  <svg role="presentation" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14" width="12" height="12">
    <path d="M12.25,7C12.25,9.9,9.9,12.25,7,12.25C4.1,12.25,1.75,9.9,1.75,7C1.75,4.1,4.1,1.75,7,1.75C9.9,1.75,12.25,4.1,12.25,7ZM11.08,7C11.08,4.74,9.26,2.92,7,2.92C4.74,2.92,2.92,4.74,2.92,7C2.92,9.26,4.74,11.08,7,11.08C9.26,11.08,11.08,9.26,11.08,7ZM9.2,6.2C9.29,6.1,9.33,5.97,9.33,5.83C9.33,5.51,9.07,5.25,8.75,5.25C8.58,5.25,8.41,5.33,8.3,5.46L6.37,7.3L5.66,6.59C5.55,6.48,5.4,6.42,5.25,6.42C4.93,6.42,4.67,6.68,4.67,7C4.67,7.15,4.73,7.3,4.84,7.41L6,8.58C6.3,8.82,6.66,8.79,6.87,8.54L9.2,6.2Z" fill="currentColor" />
  </svg>
);

const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
);

export const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
  </svg>
);

// ─── 状态图标 ─────────────────────────────────────────────────────────────────

const StatusIcon = ({ tool, icon }: { tool: ToolRecord; icon?: React.ReactElement }) => {
  if (tool.status === "pending") {
    return <span className={css["code-card-icon-pending"]}><Loading /></span>;
  }
  if (tool.status === "error") {
    return <span className={css["code-card-icon"]}><ErrorIcon /></span>;
  }
  return <span className={css["code-card-icon"]}>{icon ?? <SuccessIcon />}</span>;
};

// ─── 耗时 ────────────────────────────────────────────────────────────────────

const Duration = ({ tool }: { tool: ToolRecord }) => {
  const endTime = tool.execEndTime || undefined;
  const [elapsed, setElapsed] = useState(() =>
    tool.execStartTime ? (endTime ?? Date.now()) - tool.execStartTime : 0
  );

  useEffect(() => {
    if (!tool.execStartTime) return;
    if (endTime !== undefined) {
      setElapsed(endTime - tool.execStartTime);
      return;
    }
    const timer = setInterval(() => setElapsed(Date.now() - tool.execStartTime!), 200);
    return () => clearInterval(timer);
  }, [tool.execStartTime, endTime]);

  if (!tool.execStartTime) return null;

  const text =
    elapsed < 1000 ? null :
    elapsed >= 60000 ? (elapsed / 60000).toFixed(1) + "m" :
    Math.floor(elapsed / 1000) + "s";

  if (!text) return null;
  return <span className={css.duration}>{text}</span>;
};

// ─── TextShimmer ──────────────────────────────────────────────────────────────

const TextShimmer = ({ children }: { children: string }) => (
  <span className={css.shimmer}>{children}</span>
);

// ─── PendingCodeCard ─────────────────────────────────────────────────────────

const ApiListSection = ({ apiList }: { apiList: ApiListItem[] }) => {
  if (apiList.length === 0) return null;

  return (
    <div className={css["code-card-section"]}>
      <div className={css["code-card-api-list"]}>
        {apiList.map((item, index) => (
          <div key={item.id ?? `${item.name ?? 'api'}-${index}`} className={css["code-card-api-item"]}>
            <div className={css["code-card-api-main"]}>
              <span className={css["code-card-api-index"]}>{index + 1}.</span>
              <span className={css["code-card-api-cn-name"]}>{item.cnName || "未命名接口"}</span>
              {item.name && <span className={css["code-card-api-name"]}>{item.name}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PendingCodeCard = ({ tool, icon, title }: { tool: ToolRecord; icon: React.ReactElement; title: string }) => (
  <div className={css["code-card"]}>
    <div className={css["code-card-header"]}>
      <StatusIcon tool={tool} icon={icon} />
      <span className={css["code-card-filename"]}><TextShimmer>{title}</TextShimmer></span>
      <Duration tool={tool} />
    </div>
    <ApiListSection apiList={tool.progress?.items || []} />
  </div>
);

// ─── CodeCard ────────────────────────────────────────────────────────────────

export interface CodeCardProps {
  tool: ToolRecord;
  icon?: React.ReactElement;
  title: string;
  apiList?: ApiListItem[];
}

export const CodeCard = ({ tool, icon, title, apiList = [] }: CodeCardProps) => {
  return (
    <div className={css["code-card"]}>
      <div className={css["code-card-header"]}>
        <StatusIcon tool={tool} icon={icon} />
        <span className={css["code-card-filename"]}>{title}</span>
        <Duration tool={tool} />
      </div>
      <ApiListSection apiList={apiList} />
    </div>
  );
};
