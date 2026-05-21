import { createRequest } from "../request";
import { getOperateApiParams } from "./index";

const API_URL = "/biz/v2/ai/checkApiSchemes";

/**
 * 前端后scheme是否一致
 * @param apiSchemes 需要检测的接口列表 
 * @param fileId 
 * @returns 
 */
export async function checkState( apiSchemes: any[], fileId: string): Promise<boolean> {
  const request = createRequest({
    url: API_URL,
    method: "POST",
    body: {
        apiSchemes,
        sessionId: fileId,
        ...getOperateApiParams(),
    },
  });
  const response = await request();
  return  !!response?.data
}
