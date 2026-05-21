import { DEFAULT_RETRIES } from "./constants";
import type { RequestFn, RetryOptions } from "./types";
import { formatError, isAbortError } from "./utils";

export function wrapRequestWithRetry<T>(
  baseFn: RequestFn<T>,
  retryOptions: RetryOptions,
  onRetry?: (params: { attempt: number; maxRetries: number }) => void,
): RequestFn<T> {
  return async () => {
    const { maxRetries = DEFAULT_RETRIES } = retryOptions;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        return await baseFn();
      } catch (error) {
        if (isAbortError(error)) {
          throw error;
        }

        if (attempt >= maxRetries) {
          throw new Error(formatError(error));
        }

        onRetry?.({ attempt: attempt + 1, maxRetries });
        attempt++;
      }
    }

    throw new Error("Request failed");
  };
}
