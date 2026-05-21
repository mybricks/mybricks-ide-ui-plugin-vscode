import { DEFAULT_RETRIES } from './constants';
import { createBaseRequest } from './request';
import { wrapRequestWithRetry } from './request-retry';
import { wrapRequestStreamWithRetry } from './stream-retry';
import { createBaseRequestStream } from './stream';
import type { CreateRequestConfig, CreateRequestStreamConfig, RequestFn, StreamRequestFn } from './types';

export * from './types';

export function createRequest<T = any>(config: CreateRequestConfig): RequestFn<T> {
  const baseRequest = createBaseRequest<T>(config);
  return wrapRequestWithRetry(
    baseRequest,
    { maxRetries: config.retries ?? DEFAULT_RETRIES },
    config.onRetry
  );
}

export function createRequestStream(config: CreateRequestStreamConfig): StreamRequestFn {
  const baseRequest = createBaseRequestStream(config);
  return wrapRequestStreamWithRetry(
    baseRequest,
    { maxRetries: config.retries ?? DEFAULT_RETRIES },
    config.onRetry
  );
}
