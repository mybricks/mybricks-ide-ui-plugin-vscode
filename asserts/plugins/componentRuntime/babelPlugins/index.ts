// ------ taro ------
import handleDefineAppConfig from './handlers/defineAppConfig'
import handleDefinePageConfig from './handlers/definePageConfig'

const taroPlugin = function (params: { filename: string }) {
  const { filename } = params
  
  return function (babel) {

    const enterHandler = (programPath) => {
      const { scope, node } = programPath

      scope.traverse(node, {
        CallExpression (callPath) {
          const callee = callPath.node.callee
          switch (callee.name) {
            case 'defineAppConfig':
              handleDefineAppConfig(callPath, programPath)
              return
            case 'definePageConfig':
              handleDefinePageConfig(programPath, babel, filename)
              return 
            default:
          }
        }
      })
    }
    
    return {
      visitor: {
        Program: { enter: enterHandler }
      }
    };
  }
}



export default [taroPlugin]
