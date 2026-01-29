const { getFileContent, saveFileContent } = require('../utils/saveProject')
const { exportProject } = require('../utils/exportProject')

/**
 * 注册所有事件处理器
 * @param {MessageAPI} messageApiInstance - 消息 API 实例
 * @param {vscode.ExtensionContext} context - 扩展上下文
 */
function registerHandlers(messageApiInstance, context) {
  // 获取低码项目内容
  messageApiInstance.registerHandler('getFileContent', async () => {
    const data = getFileContent(context)
    return data
  })

  // 保存低码项目
  messageApiInstance.registerHandler('saveFileContent', async (data) => {
    saveFileContent(context, data)
  })

  // 导出项目
  messageApiInstance.registerHandler('exportProject', async (data) => {
    const { configJson } = data
    const res = await exportProject(context, configJson)
    return res
  })

  // 获取当前聚焦的元素信息
  messageApiInstance.registerHandler('getFocusElementInfo', async () => {
    // 调用前端 window.__mybricksAIService.focus 获取当前聚焦的元素信息
    const focusInfo = await messageApiInstance.callWebview('getFocusInfo')
    return focusInfo
  })
}

module.exports = registerHandlers

