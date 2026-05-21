import {  DEFAULT_TIMEOUT_MS } from "./constants";
import type { CreateRequestConfig, RequestFn } from "./types";
import { getToken, getSession } from "./utils";

export function createBaseRequest<T = any>(config: CreateRequestConfig): RequestFn<T> {
  return async function request() {
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
    const timeoutId = controller
      ? window.setTimeout(() => controller.abort(), timeoutMs)
      : null;

    try {
      const resolvedBody = typeof body === "function" ? await body() : body;
      const response = await fetch(url , {
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
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(
          `HTTP ${response.status}: ${errorText || response.statusText}`,
        );
      }

      return (await response.json()) as T;
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    }
  };
}
