export class AbortError extends Error {
  constructor() {
    super("Aborted");
    this.name = "AbortError";
  }
}

export function buildUrl(baseUrl: string, url: string) {
  if (/^https?:\/\//.test(url)) {
    return url;
  }
  return `${baseUrl.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}

export function isAbortError(error: unknown) {
  return (
    error instanceof AbortError ||
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.message.toLowerCase().includes("aborted"))
  );
}

export function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function encode(data: string | null) {
  if (!data) return "";

  try {
    return atob(atob(data));
  } catch {
    return "";
  }
}

export function getToken(){
  const token = localStorage.getItem('token')
  return encode(token)
}

export function getSession(){
  const session =localStorage.getItem('session')
  return encode(session)
}

