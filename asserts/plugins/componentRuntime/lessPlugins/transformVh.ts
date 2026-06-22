export interface TransformVhOptions {
  /** 要从 vh 中扣除的长度，默认 50px（tabbar 高度） */
  offset?: string
  /** 是否只处理 100vh，默认 true */
  only100?: boolean
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
    // calc(...) 整段（含嵌套括号）
    if (
      ch === 'c' &&
      source.startsWith('calc(', i) &&
      !/[\w-]/.test(source[i - 1] ?? '')
    ) {
      let depth = 1
      let j = i + 5
      while (j < len && depth > 0) {
        const c = source[j]
        if (c === '(') depth += 1
        else if (c === ')') depth -= 1
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

export const transformVh = (source: string, options: TransformVhOptions = {}): string => {
  const { offset = '50px', only100 = true } = options
  if (!source || !source.includes('vh')) return source


  const skipRanges = collectSkipRanges(source)

  return source.replace(VH_RE, (match, num: string, index: number) => {
    if (only100 && Number(num) !== 100) return match
    if (isInsideRange(index, skipRanges)) return match
    return `calc(${num}vh - ${offset})`
  })
}

export const hasTabbar = (appConfig: Taro.AppConfig | undefined): boolean => {
  return (appConfig?.tabBar?.list?.length ?? 0) > 1
}

export const createTransformVh = (
  appConfig: Taro.AppConfig | undefined,
  options: TransformVhOptions = {}
) => {
  if (!hasTabbar(appConfig)) {
    return (source: string) => source
  }
  return (source: string) => transformVh(source, options)
}

export default transformVh
