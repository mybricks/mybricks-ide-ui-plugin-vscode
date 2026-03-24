/**
 * VS Code 适配层：对接 comlib-pc-normal-lite code-export 的导出能力
 * 在 React 中 import { exportCodeToVSCode } 使用，同时挂到 window 供 comlib 等使用
 */

export interface CodeExportFileItem {
  fileName: string
  content: string
  type?: 'file' | 'directory'
}

export interface CodeExportProgress {
  progress: number
  currentFile?: string
  totalFiles: number
  completedFiles: number
}

export interface CodeExportToVSCodeOptions {
  folderName?: string
  /** 上次已选择的目标目录路径，传入后跳过目录选择弹窗直接写入 */
  outputDir?: string
  onProgress?: (progress: CodeExportProgress) => void
  onSuccess?: (result?: unknown) => void
  onError?: (error: Error) => void
}

function getWebViewMessageApi() {
  return typeof window !== 'undefined' ? (window as any).webViewMessageApi : undefined
}

function fileItemsToTree(
  files: CodeExportFileItem[]
): Array<{ name: string; type: string; content?: string; children?: Array<unknown> }> {
  const root: { name: string; type: string; children: Array<unknown> } = {
    name: '',
    type: 'folder',
    children: [],
  }
  for (const file of files) {
    const parts = file.fileName.split('/').filter(Boolean)
    let current: { name: string; type: string; children: Array<unknown> } = root
    for (let j = 0; j < parts.length; j++) {
      const isLast = j === parts.length - 1
      const part = parts[j]
      if (isLast) {
        current.children.push({
          name: part,
          type: 'file',
          content: file.content != null ? String(file.content) : '',
        })
      } else {
        let folder = current.children.find(
          (c: any) => c.type === 'folder' && c.name === part
        ) as { name: string; type: string; children: Array<unknown> } | undefined
        if (!folder) {
          folder = { name: part, type: 'folder', children: [] }
          current.children.push(folder)
        }
        current = folder
      }
    }
  }
  return root.children as Array<{
    name: string
    type: string
    content?: string
    children?: Array<unknown>
  }>
}

/**
 * 导出到 VS Code 工作区（与 exportToBrowser 对齐的 API）
 * 可在 React 中 import 使用，也会挂到 window.exportCodeToVSCode 供 comlib 使用
 *
 * 返回本次实际使用的导出目录路径（不含 folderName），调用方可将其保存，
 * 下次作为 options.savedPath 传入，跳过目录选择弹窗直接写入。
 */
export function exportCodeToVSCode(
  files: CodeExportFileItem[],
  options: CodeExportToVSCodeOptions = {}
): Promise<string> {
  const {
    folderName = 'mybricks-component',
    outputDir,
    onProgress,
    onSuccess,
    onError,
  } = options

  const webViewMessageApi = getWebViewMessageApi()
  if (!webViewMessageApi || typeof webViewMessageApi.call !== 'function') {
    const err = new Error(
      '当前环境不支持 VS Code 导出，请确保在 MyBricks VS Code 扩展的 Webview 中运行'
    )
    onError?.(err)
    return Promise.reject(err)
  }

  if (!Array.isArray(files) || files.length === 0) {
    const emptyErr = new Error('files 不能为空')
    onError?.(emptyErr)
    return Promise.reject(emptyErr)
  }

  const totalFiles = files.length
  const notifyProgress = (completedFiles: number, currentFileName?: string) => {
    onProgress?.({
      progress: totalFiles ? Math.round((completedFiles / totalFiles) * 100) : 100,
      currentFile: currentFileName,
      totalFiles,
      completedFiles,
    })
  }

  notifyProgress(0)

  const pickDir = () =>
    webViewMessageApi.call('selectExportDir', {}, { timeout: 0 }).then((res: { path?: string }) => {
      const p = res?.path
      if (p == null || p === '') {
        const cancelErr = new Error('用户取消选择目录')
        onError?.(cancelErr)
        throw cancelErr
      }
      return p
    })

  // 有缓存路径时先验证其是否仍然存在，不存在则重新弹出目录选择框
  const resolveDir: Promise<string> = outputDir
    ? webViewMessageApi
        .call('checkPathExists', { path: outputDir })
        .then((res: { exists?: boolean }) => (res?.exists ? outputDir : pickDir()))
    : pickDir()

  return resolveDir
    .then((dirPath: string) => {
      const basePath = dirPath.replace(/\\/g, '/').replace(/\/+$/, '') + '/' + folderName
      const tree = fileItemsToTree(files)
      return webViewMessageApi
        .call('writeWorkspaceFiles', {
          basePath,
          results: tree,
          projectMode: false,
        })
        .then((writeRes: { error?: string }) => {
          notifyProgress(totalFiles)
          if (writeRes?.error) {
            const writeErr = new Error(writeRes.error)
            onError?.(writeErr)
            throw writeErr
          }
          onSuccess?.(writeRes)
          // 返回本次使用的目录路径，供调用方缓存
          return dirPath
        })
    })
    .catch((err: unknown) => {
      onError?.(err instanceof Error ? err : new Error(String(err)))
      throw err
    })
}

// 挂到 window，供 comlib 的 vscode adapter 等使用
if (typeof window !== 'undefined') {
  (window as any).exportCodeToVSCode = exportCodeToVSCode
}
