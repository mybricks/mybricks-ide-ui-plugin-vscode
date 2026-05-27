import taroTemplateJson from './taro-template.json'

export interface FileItem {
  fileName: string
  content: string
}

export interface ComponentData {
  files: Array<{
    fileName: string
    source: string
  }>
  themes?: {
    themes: Array<{
      id: string
      name: string
      vars: Array<{
        propertyName: string
        value: string
        title: string
        type: string
      }>
    }>
  }
}

function safeDecode(value = '') {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function generateCodeStructure(data: ComponentData): FileItem[] {
  const files = new Map<string, FileItem>()
  taroTemplateJson.forEach((file) => {
    files.set(file.fileName, file)
  })

  data.files.forEach((file) => {
    const { fileName, source } = file
    if (['setup.ts', 'scheme.ts', 'requirement.md'].includes(fileName)) {
      return
    }

    const code = safeDecode(source)
    const suffix = fileName.split('.').pop()
    const outputFileName =
      suffix === 'less' && fileName !== 'app.less' && !fileName.endsWith('.module.less')
        ? fileName.replace('.less', '.module.less')
        : fileName

    files.set(`src/${outputFileName}`, {
      fileName: `src/${outputFileName}`,
      content: code,
    })
  })

  return Array.from(files.values())
}
