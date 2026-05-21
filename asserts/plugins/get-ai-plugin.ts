import {
  assertWorkspaceCommandAllowed,
  assertWorkspaceWriteAllowed,
  defaultWorkspaceDescription,
  getEnabledProjectEntries,
  getIdeWorkspaceConfig,
  getProjectVirtualPath,
  isWorkspaceAvailable,
  normalizeVirtualFilePath,
  workspaceVirtualPath,
} from './ide-workspace'

export type OnDownloadParams = {
  name: string
  content: string
}

export type GetAiPluginOptions = {
  key: string
  /** true → Infra 通道可用（由外部 checkInfraAvailable 决定）；false → 仅 mybricks / custom */
  useInfra?: boolean
  /** VSCode 下由 extension 弹窗选择保存路径并写入文件；支持异步 */
  onDownload?: (params: OnDownloadParams) => void | Promise<void>
  /** 三方库 + 主题配置（从 CDN 获取的 codingConfig） */
  codingConfig?: {
    themes?: Array<{ id: string; name: string; vars: Array<{ propertyName: string; value: string; title: string; type: string }> }>
    availableLibraries?: Array<{ name: string; version: string; readme: string; urls: string[]; library: string }>
  }
}

type AdditionalDirectory = {
  path: string
  agentsMd?: string
  getFiles: () => Promise<Array<{ path: string; content: string }>>
  updateFiles?: (files: Array<{ path: string; content: string }>) => Promise<void>
  deleteFiles?: (paths: string[]) => Promise<void>
}

type CodeAgentPlugin = {
  name: string
  version?: string
  description?: string
  enabled?: boolean
  additionalDirectories?: () => Promise<AdditionalDirectory[]>
  tools?: Tool[]
}

type Tool = {
  name: string
  title?: string
  description: string
  parameters?: Record<string, any>
  validate?: (params: any) => void
  execute: (params: any) => Promise<{ output: string; metadata?: Record<string, any> }>
}

/** 从 globalState 读取 AI 设置（channel、token、custom 配置） */
async function getAISetting(): Promise<Record<string, any>> {
  const vsCodeMessage = (window as any).webViewMessageApi
  return vsCodeMessage?.call('getAISetting').catch(() => null) ?? {}
}

/**
 * 根据已保存的 settings 和 useInfra 决定最终生效的渠道。
 * infra 在 useInfra=false 时不可用，自动降级到 mybricks。
 */
function resolveChannel(settings: Record<string, any>, useInfra: boolean): 'infra' | 'mybricks' | 'custom' {
  const saved = settings?.channel as string | undefined
  if (saved === 'infra') return useInfra ? 'infra' : 'mybricks'
  if (saved === 'custom') return 'custom'
  // 未配置时跟随 useInfra
  return useInfra ? 'infra' : 'mybricks'
}

export default async ({ key, useInfra = true, onDownload, codingConfig }: GetAiPluginOptions) => {
  const PluginAI = (window as any).MyBricksPluginAI || {}
  const {
    default: AIPlugin,
    createMyBricksAIRequestSSE,
    createInfraAIRequest,
    createInfraAIOnUpload,
    commonCodePreset
  } = PluginAI

  if (!AIPlugin) {
    console.warn('[MyBricks] window.MyBricksPluginAI is not loaded. Ensure plugin-ai is loaded via manifest.')
    return null
  }

  // 三种渠道的请求函数在插件初始化时各创建一次，config getter 动态读取 globalState
  const requestMybricks = createMyBricksAIRequestSSE({
    getToken: () => getAISetting().then((s) => s?.mybricksAiToken ?? '').catch(() => ''),
  })
  const requestInfra = useInfra ? createInfraAIRequest() : null
  const infraUpload = useInfra ? createInfraAIOnUpload() : null

  const setting = await getAISetting();
  const channel = resolveChannel(setting, useInfra);

  const customPrams = channel === 'custom' ? {
    llm: {
      providers: setting.providers,
    }
  } : {}

  /** 通过 webViewMessageApi 读取已打开文件夹，并挂载到 extra/workspace/ 虚拟目录 */
  async function getWorkspaceFiles(): Promise<Array<{ path: string; content: string }>> {
    if (!isWorkspaceAvailable(getIdeWorkspaceConfig().workspace)) return []
    const vsCodeMsg = (window as any).webViewMessageApi
    if (!vsCodeMsg?.call) return []
    try {
      const res = await vsCodeMsg.call('getWorkspaceFiles')
      return Array.isArray(res?.files)
        ? res.files.map((file: { path: string; content: string }) => ({
            ...file,
            path: file.path.replace(/^(server|workspace)\//, ''),
          }))
        : []
    } catch {
      return []
    }
  }

  function toWorkspacePath(filePath: string) {
    return filePath
      .replace(new RegExp(`^${workspaceVirtualPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '')
  }

  function createAgentsMd(params: {
    title: string
    description?: string
    read?: boolean
    write?: boolean
    bash?: boolean
    body?: string
  }) {
    const title = params.title.replace(/\r?\n/g, ' ').trim()
    const description = (params.description || '').replace(/\r?\n/g, ' ').trim()
    const permissions = [
      params.read !== false ? 'read' : '',
      params.write === true ? 'write' : '',
      params.bash === true ? 'bash' : '',
    ].filter(Boolean).join(', ')
    return [
      '---',
      `title: ${title}`,
      description ? `description: ${description}` : undefined,
      `permissions: ${permissions}`,
      '---',
      '',
      params.body || '',
    ].filter((line) => line !== undefined).join('\n')
  }

  async function updateWorkspaceFiles(files: Array<{ path: string; content: string }>) {
    assertWorkspaceWriteAllowed()
    const vsCodeMsg = (window as any).webViewMessageApi
    if (!vsCodeMsg?.call) return

    for (const file of files) {
      const res = await vsCodeMsg.call('writeWorkspaceFile', {
        path: toWorkspacePath(file.path),
        content: file.content,
      })
      if (res?.error) {
        throw new Error(res.error)
      }
    }
  }

  async function deleteWorkspaceFiles(paths: string[]) {
    assertWorkspaceWriteAllowed()
    const vsCodeMsg = (window as any).webViewMessageApi
    if (!vsCodeMsg?.call) return

    const res = await vsCodeMsg.call('deleteWorkspaceFiles', {
      paths: paths.map(toWorkspacePath),
    })
    if (res?.error) {
      throw new Error(res.error)
    }
  }

  async function getProjectFiles(projectPath: string, virtualRoot: string): Promise<Array<{ path: string; content: string }>> {
    const vsCodeMsg = (window as any).webViewMessageApi
    if (!vsCodeMsg?.call) return []

    try {
      const res = await vsCodeMsg.call('getIdeProjectFiles', {
        root: projectPath,
        virtualRoot,
      })
      return Array.isArray(res?.files) ? res.files : []
    } catch {
      // 忽略无法读取的附加项目，避免一个项目异常影响整个 AI 上下文。
      return []
    }
  }

  async function getWorkspaceRootPath() {
    const vsCodeMsg = (window as any).webViewMessageApi
    if (!vsCodeMsg?.call) return ''

    try {
      const res = await vsCodeMsg.call('getIdeWorkspaceRoot')
      return typeof res?.path === 'string' ? res.path : ''
    } catch {
      return ''
    }
  }

  function resolveProjectByVirtualPath(filePath: string) {
    const entries = getEnabledProjectEntries()
    const allProjects = entries.map(({ project }) => project)
    return entries
      .map(({ project }) => ({ project, virtualRoot: getProjectVirtualPath(project, allProjects) }))
      .find(({ virtualRoot }) => filePath === virtualRoot.replace(/\/$/, '') || filePath.startsWith(virtualRoot))
  }

  async function updateProjectFiles(projectPath: string, virtualRoot: string, files: Array<{ path: string; content: string }>) {
    const vsCodeMsg = (window as any).webViewMessageApi
    if (!vsCodeMsg?.call) return

    for (const file of files) {
      const res = await vsCodeMsg.call('writeIdeProjectFile', {
        root: projectPath,
        path: normalizeVirtualFilePath(file.path, virtualRoot),
        content: file.content,
      })
      if (res?.error) {
        throw new Error(res.error)
      }
    }
  }

  async function deleteProjectFiles(projectPath: string, virtualRoot: string, paths: string[]) {
    const vsCodeMsg = (window as any).webViewMessageApi
    if (!vsCodeMsg?.call) return

    for (const targetPath of paths) {
      const res = await vsCodeMsg.call('deleteIdeProjectFiles', {
        root: projectPath,
        paths: [normalizeVirtualFilePath(targetPath, virtualRoot)],
      })
      if (res?.error) {
        throw new Error(res.error)
      }
    }
  }

  async function getAdditionalDirectories(): Promise<AdditionalDirectory[]> {
    const config = getIdeWorkspaceConfig()
    const directories: AdditionalDirectory[] = []

    if (isWorkspaceAvailable(config.workspace)) {
      const workspaceRootPath = await getWorkspaceRootPath()
      const workspaceAgentsMd = createAgentsMd({
        title: config.workspace.title || '工作区',
        description: config.workspace.description || defaultWorkspaceDescription,
        read: true,
        write: config.workspace.writable,
        bash: config.workspace.commandable,
        body: config.workspace.content || undefined,
      })

      directories.push({
        path: workspaceVirtualPath,
        agentsMd: workspaceAgentsMd,
        getFiles: getWorkspaceFiles,
        ...(config.workspace.writable
          ? {
              updateFiles: updateWorkspaceFiles,
              deleteFiles: deleteWorkspaceFiles,
            }
          : {}),
      })
    }

    for (const { project, index } of getEnabledProjectEntries()) {
      const allProjects = config.projects
      const virtualRoot = getProjectVirtualPath(project, allProjects)
      directories.push({
        path: virtualRoot,
        agentsMd: createAgentsMd({
          title: project.name || `项目 ${index + 1}`,
          description: project.description,
          read: true,
          write: project.writable,
          bash: project.commandable,
          body: project.content || undefined,
        }),
        getFiles: () => getProjectFiles(project.path, virtualRoot),
        ...(project.writable
          ? {
              updateFiles: (files: Array<{ path: string; content: string }>) => updateProjectFiles(project.path, virtualRoot, files),
              deleteFiles: (paths: string[]) => deleteProjectFiles(project.path, virtualRoot, paths),
            }
          : {}),
      })
    }

    return directories
  }

  const runCommandTool: Tool = {
    name: 'run_command',
    title: '执行命令',
    description: `在已授权项目目录执行一个有限白名单命令。

**必须通过 workdir 参数指定命令执行目录**，workdir 必须来自项目空间上下文中展示的虚拟目录，或这些虚拟目录下的子目录。
**不要使用 \`cd <目录> && <命令>\` 的模式，请用 workdir 参数替代。**

命令要求：
- 必须是非交互式命令，不能有任何等待用户输入的交互提示。所有参数必须在命令中完整指定，例如用 --yes / -y 跳过确认，用 --no-spec 跳过测试文件生成等。
- 只允许 npm / npx / yarn / pnpm / bun / nest 这几个命令入口。
- 不支持 shell 管道、重定向、环境变量展开等 shell 语义。

超时说明：
- 默认超时 2 分钟（120000ms），最大 5 分钟。
- 命令超时后 tool result 会告知已超时，并附带超时前已收集到的 stdout/stderr 输出，可根据已有输出判断执行进度。

常用示例：
  - npm install
  - npm run build
  - npm run test`,
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: '要执行的命令，例如 npm run build、yarn test、pnpm install、nest generate module user',
        },
        workdir: {
          type: 'string',
          description: '命令的工作目录。必须使用项目空间上下文中展示的虚拟目录或其子目录，用此参数替代 cd 命令。',
        },
        timeoutMs: {
          type: 'number',
          description: '超时时间，单位毫秒，默认 120000（2 分钟），最大 300000（5 分钟）',
        },
      },
      required: ['command', 'workdir'],
    },
    validate(params: { command?: string; workdir?: string; timeoutMs?: number }) {
      if (!params.command || typeof params.command !== 'string' || !params.command.trim()) {
        throw new Error('command is required and must be a non-empty string')
      }
      if (!params.workdir || typeof params.workdir !== 'string' || !params.workdir.trim()) {
        throw new Error('workdir is required. Use an authorized virtual directory from the project context.')
      }
      if (params.timeoutMs !== undefined && (typeof params.timeoutMs !== 'number' || params.timeoutMs < 1000)) {
        throw new Error('timeoutMs must be a number greater than or equal to 1000')
      }
    },
    async execute(params: { command: string; workdir: string; timeoutMs?: number }) {
      const vsCodeMsg = (window as any).webViewMessageApi
      if (!vsCodeMsg?.call) {
        throw new Error('webViewMessageApi is not available')
      }

      const normalizedWorkdir = params.workdir.replace(/\\/g, '/').replace(/\/+$/, '')
      const projectMatch = resolveProjectByVirtualPath(normalizedWorkdir + '/')
      const workspaceRoot = workspaceVirtualPath.replace(/\/$/, '')
      const isWorkspaceWorkdir = normalizedWorkdir === workspaceRoot || normalizedWorkdir.startsWith(`${workspaceRoot}/`)

      if (!projectMatch && !isWorkspaceWorkdir) {
        throw new Error(`workdir 未授权或未开启读取权限：${params.workdir}`)
      }

      let callName = 'runWorkspaceCommand'
      let callPayload: Record<string, any>

      if (projectMatch) {
        if (!projectMatch.project.commandable) {
          throw new Error(`附加项目未开启 AI 命令执行权限：${projectMatch.project.path}`)
        }
        callName = 'runIdeProjectCommand'
        callPayload = {
          root: projectMatch.project.path,
          command: params.command,
          workdir: normalizeVirtualFilePath(normalizedWorkdir + '/', projectMatch.virtualRoot).replace(/\/$/, '') || '.',
        }
      } else {
        assertWorkspaceCommandAllowed()
        callPayload = {
          command: params.command,
          workdir: toWorkspacePath(normalizedWorkdir + '/').replace(/\/$/, '') || '.',
        }
      }

      const commandTimeout = params.timeoutMs ?? 120000
      callPayload.timeoutMs = commandTimeout
      // call 层超时需比命令超时多留 5 秒余量，避免通信层先于命令执行超时
      const callTimeout = commandTimeout + 5000

      const res = await vsCodeMsg.call(callName, callPayload, { timeout: callTimeout })

      if (res?.error) {
        throw new Error(res.error)
      }

      const stdout = res?.stdout ? `\n\nstdout:\n${res.stdout}` : ''
      const stderr = res?.stderr ? `\n\nstderr:\n${res.stderr}` : ''
      const status = res?.timedOut
        ? `timed out after ${commandTimeout}ms`
        : res?.ok
          ? 'succeeded'
          : `failed with exit code ${res?.exitCode ?? 'unknown'}`

      return {
        output: `Command ${status}: ${res?.command || params.command}\nCWD: ${res?.cwd || 'workspace root'}${stdout}${stderr}`,
        metadata: res,
      }
    },
  }

  const plugins: CodeAgentPlugin[] = [
    {
      name: 'ide-workspace',
      additionalDirectories: getAdditionalDirectories,
      tools: [runCommandTool],
    },
  ]

  return AIPlugin({
    key,
    createTemplates: {
      page: ({ title }) => {
        return {
          type: "normal",
          title: "页面",
          inputs: [
            {
              id: "open",
              title: "打开",
              schema: {
                type: "any",
              },
            },
          ],
        }
      }
    },
    onUpload: infraUpload
      ? async (params: any) => {
          const settings = await getAISetting()
          const channel = resolveChannel(settings, useInfra)
          if (channel === 'infra') return infraUpload(params)
        }
      : undefined,
    // channel === 'custom' 不会走到这里
    onRequest: async (params: any) => {
      const settings = await getAISetting()
      const channel = resolveChannel(settings, useInfra)

      if (channel === 'infra' && requestInfra) return requestInfra(params)
      return requestMybricks(params)
    },
    // channel === 'custom'会执行这里
    ...customPrams,
    onDownload,
    codingMode: true,
    codingConfig,
    plugins,
    // ...commonCodePreset
  })
}
