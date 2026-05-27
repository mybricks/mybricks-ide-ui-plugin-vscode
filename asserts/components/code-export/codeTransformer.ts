import * as parser from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import * as t from '@babel/types'

export interface CodeFile {
  path: string
  content: string
}

export class CodeTransformer {
  transformFiles(files: CodeFile[]): CodeFile[] {
    return files.map((file) => this.transformSingleFile(file))
  }

  private transformSingleFile(file: CodeFile): CodeFile {
    if (!this.isSupportedFile(file.path)) {
      return file
    }

    try {
      const ast = this.parseCode(file.content)

      this.removePopupVisibleDecorators(ast)
      this.replaceLessImports(ast)
      this.replaceMybricksLogger(ast)
      this.removeMybricksRefWrappers(ast)
      this.replaceEnvVars(ast)
      if (file.path.endsWith('dataSource.ts')) {
        this.replaceMybricksDataSourceImport(ast)
      }
      if (file.path.endsWith('.tsx')) {
        this.ensureReactImport(ast)
      }
      if (file.path.endsWith('app.tsx')) {
        this.ensureAppResetStyleImport(ast)
      }

      const output = generate(
        ast,
        { retainLines: false, jsescOption: { minimal: true } },
        file.content,
      )
      return { path: file.path, content: output.code }
    } catch (e) {
      console.log('transformSingleFile error======', e)
      return file
    }
  }

  private replaceMybricksLogger(ast: t.File) {
    let hasLogger = false

    traverse(ast, {
      ImportDeclaration(path: any) {
        if (path.node.source.value !== 'mybricks') return

        const loggerSpecifierIndex = path.node.specifiers.findIndex(
          (s: any) => t.isImportSpecifier(s) && t.isIdentifier(s.local, { name: 'logger' }),
        )
        if (loggerSpecifierIndex === -1) return

        hasLogger = true

        if (path.node.specifiers.length === 1) {
          path.remove()
        } else {
          path.node.specifiers.splice(loggerSpecifierIndex, 1)
        }
      },
    })

    if (!hasLogger) return

    traverse(ast, {
      CallExpression(path: any) {
        const callee = path.node.callee
        if (t.isMemberExpression(callee) && t.isIdentifier(callee.object, { name: 'logger' })) {
          callee.object = t.identifier('console')
        }
      },
    })
  }

  private removeMybricksRefWrappers(ast: t.File) {
    const refNames = new Set(['appRef', 'comRef', 'popupRef'])

    traverse(ast, {
      ImportDeclaration(path: any) {
        if (path.node.source.value !== 'mybricks') return

        path.node.specifiers = path.node.specifiers.filter(
          (s: any) => !(t.isImportSpecifier(s) && t.isIdentifier(s.local) && refNames.has(s.local.name)),
        )

        if (path.node.specifiers.length === 0) {
          path.remove()
        }
      },
    })

    traverse(ast, {
      CallExpression(path: any) {
        const callee = path.node.callee
        if (t.isIdentifier(callee) && refNames.has(callee.name) && path.node.arguments.length === 1) {
          path.replaceWith(path.node.arguments[0] as t.Expression)
        }
      },
    })
  }

  private replaceMybricksDataSourceImport(ast: t.File) {
    const localDataSourcePath = './utils/DataSource'

    traverse(ast, {
      ImportDeclaration(path: any) {
        if (path.node.source.value !== 'mybricks') return

        const otherSpecifiers = path.node.specifiers.filter(
          (specifier: any) => !(t.isImportSpecifier(specifier) && t.isIdentifier(specifier.local, { name: 'DataSource' })),
        )

        if (otherSpecifiers.length === path.node.specifiers.length) {
          return
        }

        const localDataSourceImport = t.importDeclaration(
          [t.importDefaultSpecifier(t.identifier('DataSource'))],
          t.stringLiteral(localDataSourcePath),
        )

        if (otherSpecifiers.length === 0) {
          path.replaceWith(localDataSourceImport)
          return
        }

        path.replaceWithMultiple([
          t.importDeclaration(otherSpecifiers, t.stringLiteral('mybricks')),
          localDataSourceImport,
        ])
      },
    })
  }

  private removePopupVisibleDecorators(ast: t.File) {
    traverse(ast, {
      Decorator(path: any) {
        const expression = path.node.expression
        const isPopupVisibleDecorator =
          t.isIdentifier(expression, { name: 'PopupVisible' }) ||
          (t.isCallExpression(expression) && t.isIdentifier(expression.callee, { name: 'PopupVisible' }))

        if (isPopupVisibleDecorator) {
          path.remove()
        }
      },
    })
  }

  private replaceLessImports(ast: t.File) {
    traverse(ast, {
      ImportDeclaration(path: any) {
        const sourceValue = path.node.source.value
        if (!sourceValue.endsWith('.less')) return
        if (sourceValue.endsWith('.module.less')) return
        if (path.node.specifiers.length === 0) return

        path.node.source = t.stringLiteral(sourceValue.replace(/\.less$/, '.module.less'))
      },
    })
  }

  private ensureAppResetStyleImport(ast: t.File) {
    const hasResetStyleImport = ast.program.body.some(
      (node) => t.isImportDeclaration(node) && node.source.value === './reset.less',
    )
    if (hasResetStyleImport) {
      return
    }

    const resetImport = t.importDeclaration([], t.stringLiteral('./reset.less'))
    let lastImportPath: any = null

    traverse(ast, {
      ImportDeclaration(path: any) {
        lastImportPath = path
      },
      Program: {
        exit(path: any) {
          if (lastImportPath) {
            lastImportPath.insertAfter(resetImport)
            return
          }

          path.unshiftContainer('body', resetImport)
        },
      },
    })
  }



  private ensureReactImport(ast: t.File) {
    let hasReactDefaultImport = false

    traverse(ast, {
      ImportDeclaration(path: any) {
        if (path.node.source.value !== 'react') return
        const hasDefault = path.node.specifiers.some((s: any) => t.isImportDefaultSpecifier(s))
        if (hasDefault) hasReactDefaultImport = true
      },
    })

    if (hasReactDefaultImport) return

    const reactImport = t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier('React'))],
      t.stringLiteral('react'),
    )
    ast.program.body.unshift(reactImport)
  }

  private replaceEnvVars(ast: t.File) {
    type RawExpr = { __rawExpr: true; expr: string }

    const objectValues: Record<string, unknown> = {
      'process.env.POPUP_VISIBLE': false,
      'process.env.POPUP_NODE': { __rawExpr: true, expr: 'document.body' } as RawExpr,
    }
    const objectPaths = Object.keys(objectValues)

    const buildRawExprNode = (raw: RawExpr): t.Expression => {
      const parts = raw.expr.split('.')
      let node: t.Expression = t.identifier(parts[0])
      for (let i = 1; i < parts.length; i++) {
        node = t.memberExpression(node, t.identifier(parts[i]))
      }
      return node
    }

    const replaceAndEvaluate = (nodePath: any, replacement: unknown) => {
      if (replacement && typeof replacement === 'object' && (replacement as RawExpr).__rawExpr) {
        nodePath.replaceWith(buildRawExprNode(replacement as RawExpr))
      } else {
        nodePath.replaceWith(t.valueToNode(replacement))
      }

      if (nodePath.parentPath?.isBinaryExpression()) {
        const result = nodePath.parentPath.evaluate()
        if (result.confident) {
          nodePath.parentPath.replaceWith(t.valueToNode(result.value))
        }
      }

      if (nodePath.parentPath?.isLogicalExpression()) {
        const logical = nodePath.parentPath
        const { operator, left, right } = logical.node
        const leftResult = logical.get('left').evaluate()
        if (leftResult.confident) {
          const leftVal = leftResult.value
          if (operator === '||') {
            logical.replaceWith(leftVal ? left : right)
          } else if (operator === '&&') {
            logical.replaceWith(leftVal ? right : left)
          }
        }
      }

      if (nodePath.parentPath?.isIfStatement()) {
        const ifPath = nodePath.parentPath
        const testResult = ifPath.get('test').evaluate()
        if (testResult.confident) {
          if (!testResult.value) {
            if (ifPath.node.alternate) {
              ifPath.replaceWith(ifPath.node.alternate)
            } else {
              ifPath.remove()
            }
          } else {
            ifPath.replaceWith(ifPath.node.consequent)
          }
        }
      }
    }

    traverse(ast, {
      MemberExpression(nodePath: any) {
        const matchedKey = objectPaths.find((key) => nodePath.matchesPattern(key))
        if (matchedKey !== undefined && Object.prototype.hasOwnProperty.call(objectValues, matchedKey)) {
          replaceAndEvaluate(nodePath, objectValues[matchedKey])
        }
      },
    })
  }

  private parseCode(code: string): t.File {
    return parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx', 'decorators-legacy'],
    })
  }

  private isSupportedFile(filePath: string): boolean {
    return /\.(tsx|jsx|ts|js)$/.test(filePath)
  }
}
