export interface TransformVhOptions {
  /** tabbar 高度，默认 50px */
  tabbarHeight?: number | string
  /** 100vh 的基准高度，默认 896px */
  baseHeight?: number | string
}

const VH_RE = /(?<![\w.])(\d+(?:\.\d+)?)vh\b/g

const collectSkipRanges = (source: string): Array<[number, number]> => {
  const ranges: Array<[number, number]> = []
  const len = source.length
  let i = 0
  while (i < len) {
    const ch = source[i]
    const next = source[i + 1]

    // 块注释
    if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2)
      const stop = end === -1 ? len : end + 2
      ranges.push([i, stop])
      i = stop
      continue
    }
    // 行注释（less / sass）
    if (ch === '/' && next === '/') {
      const nl = source.indexOf('\n', i + 2)
      const stop = nl === -1 ? len : nl
      ranges.push([i, stop])
      i = stop
      continue
    }
    // 字符串
    if (ch === '"' || ch === "'") {
      let j = i + 1
      while (j < len) {
        if (source[j] === '\\') { j += 2; continue }
        if (source[j] === ch) { j += 1; break }
        j += 1
      }
      ranges.push([i, j])
      i = j
      continue
    }
    i += 1
  }
  return ranges
}

const isInsideRange = (index: number, ranges: Array<[number, number]>) => {
  for (const [start, end] of ranges) {
    if (index >= start && index < end) return true
    if (start > index) return false
  }
  return false
}

const toNumber = (val: number | string): number => {
  if (typeof val === 'number') return val
  return parseFloat(val)
}

export const transformVh = (source: string, options: TransformVhOptions = {}): string => {
  const { baseHeight = 896 } = options
  if (!source || !source.includes('vh')) return source

  const skipRanges = collectSkipRanges(source)
  const base = toNumber(baseHeight)

  return source.replace(VH_RE, (match, num: string, index: number) => {
    if (isInsideRange(index, skipRanges)) return match
    const px = (Number(num) * base / 100)
    const pxStr = Number.isInteger(px) ? `${px}px` : `${px.toFixed(2)}px`
    return pxStr
  })
}

export const hasTabbar = (appConfig: Taro.AppConfig | undefined): boolean => {
  return (appConfig?.tabBar?.list?.length ?? 0) > 1
}

export const createTransformVh = (
  appConfig: Taro.AppConfig | undefined,
  options: TransformVhOptions = {}
) => {
  const { tabbarHeight = 50, baseHeight = 896 } = options
  const hasTab = hasTabbar(appConfig)
  const effectiveBase = hasTab ? toNumber(baseHeight) - toNumber(tabbarHeight) : toNumber(baseHeight)

  return (source: string) => transformVh(source, { baseHeight: effectiveBase })
}

export default transformVh
