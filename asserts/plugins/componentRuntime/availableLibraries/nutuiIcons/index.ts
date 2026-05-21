import { ICON_NAMES } from './iconNames'
import validator from './validator'
import usageMd from './usage.md?raw'

export default {
  readme: usageMd + '\n\n## 可用图标列表\n' + Array.from(ICON_NAMES).join(', '),
  validator,
}
