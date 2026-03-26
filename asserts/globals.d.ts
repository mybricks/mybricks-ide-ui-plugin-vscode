// 声明 CDN 引入的全局变量（用于 Vite external）
declare module 'react' {
  export = React
}

declare module 'react-dom/client' {
  export = ReactDOM
}

declare module 'antd' {
  export const ConfigProvider: any
  export const Popover: any
  export const Form: any
  export const Input: any
  export const Button: any
  export const message: any
  export const Space: any
  export const Tooltip: any
  export const Flex: any
  export const Alert: any
  export const Select: any
  export const Divider: any
  export const Modal: any
  export const Tabs: any
  export const Card: any
  export const List: any
  export const Spin: any
  export const Empty: any
  export const Table: any
  export const Pagination: any
  export const Switch: any
  export const Checkbox: any
  export const Radio: any
  export const DatePicker: any
  export const TimePicker: any
  export const Upload: any
  export const Progress: any
  export const Tag: any
  export const Badge: any
  export const Avatar: any
  export const Dropdown: any
  export const Menu: any
  export const Breadcrumb: any
  export const Steps: any
  export const Drawer: any
  export const notification: any
}

declare module '@ant-design/icons' {
  export const VerticalAlignBottomOutlined: any
  export const PlusOutlined: any
  export const DeleteOutlined: any
  export const EditOutlined: any
  export const SearchOutlined: any
  export const CloseOutlined: any
  export const CheckOutlined: any
  export const DownOutlined: any
  export const UpOutlined: any
  export const LeftOutlined: any
  export const RightOutlined: any
  export const LoadingOutlined: any
  export const ExclamationCircleOutlined: any
  export const InfoCircleOutlined: any
  export const QuestionCircleOutlined: any
  export const CloseCircleOutlined: any
  export const CheckCircleOutlined: any
}

declare global {
  const React: typeof import('react')
  const ReactDOM: typeof import('react-dom/client')
  const MyBricksAPI: any
  
  /** code-export 适配：与 comlib-pc-normal-lite code-export 的 ExportProgress 一致 */
  interface CodeExportProgress {
    progress: number
    currentFile?: string
    totalFiles: number
    completedFiles: number
  }

  /** code-export 适配：FileItem 与 structure-generator 一致 */
  interface CodeExportFileItem {
    fileName: string
    content: string
    type?: 'file' | 'directory'
  }

  interface CodeExportToVSCodeOptions {
    folderName?: string
    onProgress?: (progress: CodeExportProgress) => void
    onSuccess?: (result?: unknown) => void
    onError?: (error: Error) => void
  }

  interface Window {
    antd: typeof import('antd')
    icons: any
    mybricks: any
    config: any
    VS_CODE: any
    webViewMessageApi: any
    MyBricksPluginAI?: any
    /** 由 asserts/ai/mcp 在 setting mybricks.mcp.enabled 为 true 时挂载 */
    __mybricksAIService: any
    MyBricksAPI: any
    /** code-export VS Code 适配：导出到工作区，API 与 exportToBrowser 对齐；仅扩展 Webview 内存在 */
    exportCodeToVSCode: (files: CodeExportFileItem[], options?: CodeExportToVSCodeOptions) => Promise<void>
  }
}

declare module '*.module.less' {
  const classes: Record<string, string>
  export default classes
}

export {}
