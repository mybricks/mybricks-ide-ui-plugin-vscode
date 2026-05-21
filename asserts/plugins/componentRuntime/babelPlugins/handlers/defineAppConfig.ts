import buildAppEntryCode from './buildAppEntryCode'
import { astToValue, codeToAst } from '../utils/ast'

export default function handleDefineAppConfig(callPath, programPath) {
  const appConfig = astToValue(callPath.node.arguments[0])
  const result = codeToAst(buildAppEntryCode(Object.assign(
    {
      router: {},
      appId: "MyBricksAITaro"
    },
    appConfig
  )))
  programPath.node.body = result.ast.program.body
}