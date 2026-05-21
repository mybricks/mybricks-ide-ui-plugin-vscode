import { DEFAULT_TIMEOUT_MS } from "./constants";
import { readSSEStream } from "./sse";
import type {
  CreateRequestStreamConfig,
  StreamRequestFn,
  StreamRequestParams,
} from "./types";
import { getToken, getSession} from "./utils";

export function createBaseRequestStream(
  config: CreateRequestStreamConfig,
): StreamRequestFn {
  return async function requestStream(params: StreamRequestParams) {
    const { emits } = params;
    const {
      url,
      method = "POST",
      headers = {},
      body,
      timeoutMs = DEFAULT_TIMEOUT_MS,
      credentials = "include",
    } = config;

    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    emits.cancel(() => controller?.abort());

    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    const timeoutId = controller
      ? window.setTimeout(() => controller.abort(), timeoutMs)
      : null;

    try {
      const resolvedBody = typeof body === "function" ? await body() : body;
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "token": getToken(),
          "session": getSession(),
          ...headers,
        },
        body:
          resolvedBody === undefined ? undefined : JSON.stringify(resolvedBody),
        signal: controller?.signal,
        credentials,
      });

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => response.statusText);
        throw new Error(
          `HTTP ${response.status}: ${errorText || response.statusText}`,
        );
      }

      if (!response.body) {
        throw new Error("empty response body");
      }

      reader = response.body.getReader();
      await readSSEStream({
        reader,
        write: emits.write,
        complete: emits.complete,
        error: emits.error,
        onThinking: emits.onThinking,
      });
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      try {
        await reader?.cancel();
      } catch {
        // ignore
      }
    }
  };
}
