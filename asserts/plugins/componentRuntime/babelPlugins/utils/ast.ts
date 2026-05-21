/**
 * 将 Babel 的 AST 节点对象转换为对应的原生 JavaScript 值（如对象、数组、字符串等）
 * @param node Babel AST 节点对象
 * @returns 对应的原生 JavaScript 值
 */
export function astToValue(node) {
  if (!node) return undefined

  switch (node.type) {
    case 'ObjectExpression':
      const obj = {}
      node.properties.forEach(prop => {
        if (prop.type === 'ObjectProperty') {
          const key = prop.key.name || prop.key.value
          obj[key] = astToValue(prop.value)
        }
      })
      return obj

    case 'ArrayExpression':
      return node.elements.map(el => astToValue(el))

    case 'StringLiteral':
      return node.value

    case 'NumericLiteral':
      return node.value

    case 'BooleanLiteral':
      return node.value

    case 'NullLiteral':
      return null

    default:
      return undefined
  }
}

/**
 * 使用全局的 Babel 进行代码转换，将生成的字符串代码转换为对应的 AST
 */
export function codeToAst(newCode: string) {
  return window.Babel.transform(newCode, {
    presets: [
      [
        "env",
        {
          "modules": "commonjs"
        }
      ],
      'react'
    ],
    ast: true,
    code: false
  })
}