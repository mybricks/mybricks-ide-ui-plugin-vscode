import { CodeTransformer } from './codeTransformer'
import {
  generateCodeStructure,
  type ComponentData,
  type FileItem,
} from './structureGenerator'
import { localizeRemoteTabBarIcons } from './tabbarGenerator'

export type ExportJSON = any

export type AiExportContext = {
  comId: string
  sceneId: string
  model: any
  data: ComponentData
}

function getTransformableCodeFiles(files: FileItem[]) {
  return files.flatMap((file) => {
    if (typeof file.content !== 'string') {
      return []
    }

    return [{
      path: file.fileName,
      content: file.content,
    }]
  })
}

function mergeTransformedCodeFiles(files: FileItem[], transformedFiles: Array<{ path: string; content: string }>): FileItem[] {
  const transformedMap = new Map(transformedFiles.map((file) => [file.path, file.content]))

  return files.map((file) => {
    const transformedContent = transformedMap.get(file.fileName)
    if (typeof transformedContent === 'undefined') {
      return file
    }

    return {
      ...file,
      content: transformedContent,
    }
  })
}

export function getAiExportContext(exportJSON: ExportJSON): AiExportContext | null {
  const scenes = Array.isArray(exportJSON?.scenes) ? exportJSON.scenes : []

  for (const scene of scenes) {
    const coms = scene?.coms || {}
    for (const [comId, com] of Object.entries<any>(coms)) {
      const data = com?.model?.data
      if (!data || !Array.isArray(data.files) || data.files.length === 0) {
        continue
      }

      if (com?.def?.namespace === 'mybricks.basic-comlib.ai-mix' || com?.asRoot) {
        return {
          comId,
          sceneId: scene.id,
          model: com.model,
          data,
        }
      }
    }
  }

  return null
}

export function transformGeneratedCodeFiles(files: FileItem[]): FileItem[] {
  const transformer = new CodeTransformer()
  const transformedFiles = transformer.transformFiles(getTransformableCodeFiles(files))
  return mergeTransformedCodeFiles(files, transformedFiles)
}

export async function generateAiExportFiles(data: ComponentData): Promise<FileItem[]> {
  const files = generateCodeStructure(data)
  const transformedFiles = transformGeneratedCodeFiles(files)
  return localizeRemoteTabBarIcons(transformedFiles)
}

export async function generateAiExportFilesFromJSON(exportJSON: ExportJSON): Promise<FileItem[]> {
  const context = getAiExportContext(exportJSON)

  if (!context?.data?.files?.length) {
    throw new Error('源代码为空，暂无可导出的内容')
  }

  return generateAiExportFiles(context.data)
}

export async function generateAiExportFilesFromResources(resourceResult: any): Promise<FileItem[]> {
  const rawList = Array.isArray(resourceResult) ? resourceResult : [resourceResult]
  const files = rawList.flatMap((item) => {
    const resourceFiles = Array.isArray(item?.files)
      ? item.files
      : Array.isArray(item?.data?.files)
        ? item.data.files
        : []

    return resourceFiles
      .map((file: any) => {
        const fileName = file?.fileName || file?.path
        if (!fileName) {
          return null
        }

        if (typeof file?.source === 'string') {
          return {
            fileName,
            source: file.source,
          }
        }

        const content = file?.content ?? ''
        return {
          fileName,
          source: encodeURIComponent(typeof content === 'string' ? content : String(content)),
        }
      })
      .filter(Boolean)
  })

  if (!files.length) {
    throw new Error('源代码为空，暂无可导出的内容')
  }

  return generateAiExportFiles({ files })
}
