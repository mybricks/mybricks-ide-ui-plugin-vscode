export type OperateApiSummaryFiles = {
  apiScheme: any[];
  requirement: string;
};

export type SummaryCacheItem = {
  fingerprint: string;
  summary: string;
  updatedAt: number;
};

const SUMMARY_CACHE_EXPIRE_MS = 30 * 60 * 1000;
const summaryCacheMap = new Map<string, SummaryCacheItem>();

function djb2(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(16);
}

export function buildOperateApiFingerprint(filesObj: OperateApiSummaryFiles, userMessage: string): string {
  const stable = JSON.stringify([filesObj.apiScheme, filesObj.requirement, userMessage]);
  return djb2(stable);
}

export function getOperateApiSummaryCache(fileId: string, fingerprint: string) {
  const cache = summaryCacheMap.get(fileId);
  if (!cache) {
    return null;
  }

  if (Date.now() - cache.updatedAt > SUMMARY_CACHE_EXPIRE_MS) {
    summaryCacheMap.delete(fileId);
    return null;
  }

  if (cache.fingerprint !== fingerprint) {
    return null;
  }

  return cache.summary;
}

export function setOperateApiSummaryCache(fileId: string, fingerprint: string, summary: string) {
  summaryCacheMap.set(fileId, {
    fingerprint,
    summary,
    updatedAt: Date.now(),
  });
}
