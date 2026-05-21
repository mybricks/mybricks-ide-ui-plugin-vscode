import { DEFAULT_RETRIES } from "./constants";
import type {
  RetryOptions,
  StreamRequestFn,
  StreamRequestParams,
} from "./types";
import { AbortError, formatError, isAbortError } from "./utils";

export function wrapRequestStreamWithRetry(
  baseFn: StreamRequestFn,
  retryOptions: RetryOptions,
  onRetry?: (params: { attempt: number; maxRetries: number }) => void,
): StreamRequestFn {
  return async (params: StreamRequestParams) => {
    const { maxRetries = DEFAULT_RETRIES } = retryOptions;
    const originalError = params.emits.error;
    const retryAbortController = new AbortController();

    params.emits.cancel(() => {
      retryAbortController.abort();
    });

    let attempt = 0;

    while (attempt <= maxRetries) {
      if (retryAbortController.signal.aborted) {
        const abortError = new AbortError();
        originalError(abortError);
        throw abortError;
      }

      try {
        await new Promise<void>((resolve, reject) => {
          const abortHandler = () => reject(new AbortError());
          retryAbortController.signal.addEventListener("abort", abortHandler);

          const cleanup = () => {
            retryAbortController.signal.removeEventListener(
              "abort",
              abortHandler,
            );
          };

          params.emits.error = (error: any) => {
            cleanup();
            reject(error);
          };

          baseFn(params)
            .then(() => {
              cleanup();
              resolve();
            })
            .catch((error) => {
              cleanup();
              reject(error);
            });
        });

        return;
      } catch (error) {
        if (isAbortError(error) || retryAbortController.signal.aborted) {
          params.emits.error = originalError;
          originalError(error);
          throw error;
        }

        if (attempt >= maxRetries) {
          const finalError = new Error(formatError(error));
          params.emits.error = originalError;
          originalError(finalError);
          throw finalError;
        }

        onRetry?.({ attempt: attempt + 1, maxRetries });
        attempt++;
      }
    }
  };
}
