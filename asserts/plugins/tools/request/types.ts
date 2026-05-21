export type StreamRequestEmits = {
  write: (chunk: string) => void;
  complete: (value: string) => void;
  error: (error: any) => void;
  cancel: (fn: () => void) => void;
  onThinking?: (chunk: string) => void;
};

export type StreamRequestParams = {
  emits: StreamRequestEmits;
};

export type CreateRequestStreamConfig = {
  baseUrl?: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?:
    | Record<string, any>
    | (() => Record<string, any> | Promise<Record<string, any>>);
  timeoutMs?: number;
  retries?: number;
  credentials?: RequestCredentials;
  onRetry?: (params: { attempt: number; maxRetries: number }) => void;
};

export type RetryOptions = {
  maxRetries?: number;
};

export type CreateRequestConfig = {
  baseUrl?: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?:
    | Record<string, any>
    | (() => Record<string, any> | Promise<Record<string, any>>);
  timeoutMs?: number;
  retries?: number;
  credentials?: RequestCredentials;
  onRetry?: (params: { attempt: number; maxRetries: number }) => void;
};

export type RequestFn<T = any> = () => Promise<T>;

export type StreamRequestFn = (params: StreamRequestParams) => Promise<void>;
