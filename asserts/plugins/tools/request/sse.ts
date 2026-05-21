/**
 * 解析后端自定义格式的 SSE 数据
 * 格式: { text, thought, sessionId, status, message, ... }
 */
function parseCustomSSEData(data: string): {
  content?: string;
  thinking?: string;
  error?: string;
} {
  if (!data) return {};

  try {
    const json = JSON.parse(data);
    if (json.status && json.status >= 400) {
      return { error: json.message || `Error ${json.status}` };
    }

    return {
      content: json.text ?? undefined,
      thinking: json.thought ?? undefined,
    };
  } catch {
    return {};
  }
}

export interface ReadSSEStreamOptions {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  write: (chunk: string) => void;
  complete: (v: string) => void;
  error: (e: any) => void;
  onThinking?: (chunk: string) => void;
}

/**
 * 读取标准 SSE 流（event/data/retry 格式）
 *
 * 格式示例:
 * event:message
 * data:{...}
 * retry:5000
 *
 * event:end
 * data:
 * retry:5000
 */
export async function readSSEStream(opts: ReadSSEStreamOptions): Promise<void> {
  const { reader, write, complete, error, onThinking } = opts;

  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";
  let currentData = "";

  const dispatchEvent = () => {
    if (currentEvent === "end") {
      complete("");
      return true;
    }

    if ((currentEvent === "message" || currentEvent === "step") && currentData) {
      const parsed = parseCustomSSEData(currentData);
      if (parsed.error) {
        error(new Error(parsed.error));
        throw new Error(parsed.error);
      }
      if (currentEvent === "message" && parsed.content) write(parsed.content);
      if (parsed.thinking && onThinking) onThinking(parsed.thinking);
    }

    currentEvent = "";
    currentData = "";
    return false;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line === "" || line.startsWith(":")) {
          const ended = dispatchEvent();
          if (ended) return;
          continue;
        }

        const colonIdx = line.indexOf(":");
        if (colonIdx === -1) continue;

        const field = line.slice(0, colonIdx);
        const val = line.slice(colonIdx + 1).replace(/^ /, "");

        if (field === "event") currentEvent = val;
        else if (field === "data") currentData = val;
      }
    }

    complete("");
  } catch (err) {
    error(err);
    throw err;
  }
}
