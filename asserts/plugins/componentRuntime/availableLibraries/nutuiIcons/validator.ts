import { ICON_NAMES } from './iconNames';
import type { LibraryValidator } from '../types';

const LIBRARY_NAME = '@nutui/icons-react-taro'
const FIX_HINT = `修正建议：请参考 ${LIBRARY_NAME} 可用图标列表`

const validator: LibraryValidator = {
  libraryName: LIBRARY_NAME,

  validatePlugin(_ctx) {
    return function nutuiIconsReactTaroValidatorPlugin(_babel: any) {
      return {
        visitor: {
          ImportDeclaration(path: any) {
            if (path.node.source.value !== LIBRARY_NAME) return

            path.node.specifiers.forEach((spec: any) => {
              if (spec.type !== 'ImportSpecifier') return
              const name: string = spec.imported?.name ?? spec.imported?.value ?? ''
              if (!name || ICON_NAMES.has(name)) return

              throw path.buildCodeFrameError(
                `[icon 校验] 不存在的 ${LIBRARY_NAME} 图标：${name}\n${FIX_HINT}`
              )
            })
          },

          MemberExpression(path: any) {
            if (!path.node.computed || path.node.property.type !== 'StringLiteral') return

            const objectName: string = path.node.object.name ?? ''
            if (!objectName) return

            const binding = path.scope.getBinding(objectName)
            if (!binding) return

            const bindingPath = binding.path
            if (
              bindingPath.node.type === 'ImportNamespaceSpecifier' &&
              bindingPath.parent?.source?.value === LIBRARY_NAME
            ) {
              const name: string = path.node.property.value
              if (!ICON_NAMES.has(name)) {
                throw path.buildCodeFrameError(
                  `[icon 校验] 动态访问了不存在的 ${LIBRARY_NAME} 图标：${objectName}['${name}']\n${FIX_HINT}`
                )
              }
            }
          },
        },
      }
    }
  },
};

export default validator;
