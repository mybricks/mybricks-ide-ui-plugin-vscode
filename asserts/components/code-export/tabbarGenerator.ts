import type { FileItem } from './structureGenerator'

const TABBAR_ASSET_DIR = 'src/assets/tabbar'
const TABBAR_ICON_PATTERN = /(\b(?:iconPath|selectedIconPath)\s*:\s*)(['"])(https?:\/\/[^'"]*)\2/g

const isRemoteHttpUrl = (value: string) => /^https?:\/\//i.test(value)

const stripQuery = (value: string) => value.split('#')[0].split('?')[0]

const getExtensionFromContentType = (contentType?: string | null) => {
  if (!contentType) return ''
  if (contentType.includes('svg')) return 'svg'
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg'
  if (contentType.includes('gif')) return 'gif'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('bmp')) return 'bmp'
  if (contentType.includes('x-icon') || contentType.includes('icon')) return 'ico'
  return ''
}

const getExtensionFromUrl = (url: string) => {
  const cleanUrl = stripQuery(url)
  const matched = cleanUrl.match(/\.([a-zA-Z0-9]+)$/)
  return matched?.[1]?.toLowerCase() || ''
}

const inferImageExtension = (url: string, contentType?: string | null) => {
  return getExtensionFromContentType(contentType) || getExtensionFromUrl(url) || 'png'
}

const isSupportedTabBarExtension = (extension: string) => {
  return ['png', 'jpg', 'jpeg'].includes(extension)
}

const getMimeTypeByExtension = (extension: string) => {
  if (extension === 'jpg' || extension === 'jpeg') {
    return 'image/jpeg'
  }
  return 'image/png'
}

const downloadRemoteImage = async (url: string) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`tabBar 图标下载失败: ${url}`)
  }

  const contentType = response.headers.get('Content-Type')
  if (contentType && !contentType.startsWith('image/')) {
    throw new Error(`tabBar 图标不是图片资源: ${url}`)
  }

  const blob = await response.blob()
  return {
    blob,
    contentType,
  }
}

const normalizeTabBarImage = async (blob: Blob, url: string, contentType?: string | null) => {
  const extension = inferImageExtension(url, contentType)
  const normalizedExtension = isSupportedTabBarExtension(extension) ? extension : 'png'

  return {
    blob: await convertBlobToImage(blob, getMimeTypeByExtension(normalizedExtension)),
    extension: normalizedExtension,
  }
}

const convertBlobToImage = async (blob: Blob, mimeType: string) => {
  const objectUrl = URL.createObjectURL(blob)

  try {
    const image = await loadImage(objectUrl)
    const canvas = document.createElement('canvas')
    const width = image.naturalWidth || image.width
    const height = image.naturalHeight || image.height

    canvas.width = width * 2
    canvas.height = height * 2

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('tabBar 图标转换失败: 无法创建 canvas 上下文')
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const resultBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error('tabBar 图标转换失败: 无法生成图片'))
          return
        }
        resolve(result)
      }, mimeType, 1)
    })

    return resultBlob
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

const loadImage = (src: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`tabBar 图标转换失败: ${src}`))
    image.src = src
  })
}

const buildTabbarAssetFileName = (
  index: number,
  fieldName: 'iconPath' | 'selectedIconPath',
  extension: string,
) => {
  const suffix = fieldName === 'iconPath' ? 'icon' : 'selected'
  return `tabbar-${index}-${suffix}.${extension}`
}

export async function localizeRemoteTabBarIcons(files: FileItem[]): Promise<FileItem[]> {
  const appConfigIndex = files.findIndex((file) => file.fileName === 'src/app.config.ts')
  if (appConfigIndex < 0) {
    return files
  }

  const appConfigFile = files[appConfigIndex]
  if (typeof appConfigFile.content !== 'string') {
    return files
  }

  const assetFiles: FileItem[] = []
  const downloadCache = new Map<string, string>()
  let matchedIndex = 0

  const rewrittenCode = await replaceAsync(
    appConfigFile.content,
    TABBAR_ICON_PATTERN,
    async (matched, prefix: string, quote: string, url: string) => {
      if (!isRemoteHttpUrl(url)) {
        return matched
      }

      const cachedPath = downloadCache.get(url)
      if (typeof cachedPath !== 'undefined') {
        matchedIndex += 1
        return `${prefix}${quote}${cachedPath}${quote}`
      }

      const fieldName = prefix.includes('selectedIconPath') ? 'selectedIconPath' : 'iconPath'

      try {
        const { blob, contentType } = await downloadRemoteImage(url)
        const normalizedImage = await normalizeTabBarImage(blob, url, contentType)
        const fileName = buildTabbarAssetFileName(matchedIndex, fieldName, normalizedImage.extension)
        const relativePath = `assets/tabbar/${fileName}`

        assetFiles.push({
          fileName: `${TABBAR_ASSET_DIR}/${fileName}`,
          content: normalizedImage.blob,
        })
        downloadCache.set(url, relativePath)
        matchedIndex += 1

        return `${prefix}${quote}${relativePath}${quote}`
      } catch (error) {
        console.error('[Taro 导出] tabBar 图标处理失败', {
          fieldName,
          url,
          error,
        })
        downloadCache.set(url, '')
        matchedIndex += 1
        return `${prefix}${quote}${quote}`
      }
    },
  )

  if (assetFiles.length === 0) {
    return files
  }

  const nextFiles = [...files]
  nextFiles[appConfigIndex] = {
    ...appConfigFile,
    content: rewrittenCode,
  }

  return [...nextFiles, ...assetFiles]
}

async function replaceAsync(
  input: string,
  pattern: RegExp,
  replacer: (...args: any[]) => Promise<string>,
) {
  const matches = Array.from(input.matchAll(pattern))
  if (matches.length === 0) {
    return input
  }

  const replacements = await Promise.all(
    matches.map((match) => replacer(match[0], ...match.slice(1), match.index, match.input, match.groups)),
  )

  let cursor = 0
  let result = ''
  matches.forEach((match, index) => {
    const start = match.index ?? 0
    result += input.slice(cursor, start)
    result += replacements[index]
    cursor = start + match[0].length
  })
  result += input.slice(cursor)

  return result
}
