/**
 * MCP AI 相关类型定义
 */

export interface AiServiceAPI {
  global: {
    title: string
    api: {
      getAllPageInfo: () => { pageAry: any[] }[]
      getAllComDefPrompts: () => string
      getComEditorPrompts: (ns: string) => string
    }
  }
  page: {
    title: string
    params: string[]
    api: {
      updatePage: (...params: any) => void
      getPageDSLPrompts: (...params: any) => string
      getPageContainerPrompts: (...params: any) => string
      clearPageContent: (pageId: string) => void
      getOutlineInfo: (...params: any) => any
      createCanvas: () => { id: string; title: string }
      createPage: (id: string, title: string, config?: any) => { id: string; onProgress: Function }
      getPageOnProcess: (...params: any) => any
    }
  }
  uiCom: {
    title: string
    api: {
      updateCom: (...params: any) => void
      getComPrompts: (...params: any) => string
      getComDSLPrompts: (...params: any) => string
      /** @deprecated 废弃 */
      getComEditorPrompts: (...params: any) => string
      getOutlineInfo: (...params: any) => any
      getComOnProcess: (...params: any) => any
    }
  }
  diagram: {
    title: string
    api: {
      createDiagram: (...args: any) => { id: string; title: string }
      updateDiagram: (...args: any) => void
      getDiagramInfo: (...args: any) => any
      getDiagramInfoByVarId: (...args: any) => any
      getDiagramInfoByListenerInfo: (...args: any) => any
    }
  }
  logicCom: {
    title: string
    api: {
      getOutlineInfo: (...params: any) => any
      updateCom: (...params: any) => void
    }
  }
}

export type AiServiceFocusParams = {
  onProgress?: (status: 'start' | 'ing' | 'complete') => void
  focusArea?: {
    selector: string
    title: string
  }
  comId?: string
  pageId?: string
  title: string
  type: 'page' | 'uiCom' | 'section' | 'logicCom' | string
  vibeCoding?: boolean
}

export interface MyBricksAIService {
  api: AiServiceAPI | null
  focus: AiServiceFocusParams | null | undefined
  isReady: () => boolean
  ready: () => Promise<MyBricksAIService>
}
