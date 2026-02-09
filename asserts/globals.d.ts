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
  
  interface Window {
    antd: typeof import('antd')
    icons: any
    mybricks: any
    config: any
    VS_CODE: any
    webViewMessageApi: any
    /** 由 asserts/ai/mcp 在 setting mybricks.mcp.enabled 为 true 时挂载 */
    __mybricksAIService: any
    MyBricksAPI: any
  }
}

export {}
