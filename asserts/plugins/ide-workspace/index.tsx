import React, { useEffect, useState } from 'react'
import {
  DeleteOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons'
import './index.css'

type PathPermission = {
  enabled: boolean
  title?: string
  description?: string
  content?: string
  writable: boolean
  commandable: boolean
}

export type ProjectPermission = PathPermission & {
  id: string
  path: string
  name?: string
}

export type IdeWorkspacePluginConfig = {
  workspace: PathPermission
  projects: ProjectPermission[]
}

export type EnabledProjectEntry = {
  project: ProjectPermission
  index: number
}

const IDE_WORKSPACE_PLUGIN_NAME = '@mybricks/plugins/ide-workspace'

const defaultWorkspaceTitle = '工作区'
export const defaultWorkspaceDescription = `VSCode 中已打开的文件夹路径，可作为项目文件的读取、写入和命令执行范围。`

function createDefaultConfig(): IdeWorkspacePluginConfig {
  return {
    workspace: {
      enabled: false,
      title: defaultWorkspaceTitle,
      description: defaultWorkspaceDescription,
      writable: false,
      commandable: false,
    },
    projects: [],
  }
}

let currentIdeWorkspaceConfig: IdeWorkspacePluginConfig = createDefaultConfig()

function createProjectId() {
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getPathName(projectPath: string) {
  const segments = String(projectPath || '').split(/[/\\]/).filter(Boolean)
  return segments[segments.length - 1] || 'project'
}

function ensureConfig(config?: IdeWorkspacePluginConfig): IdeWorkspacePluginConfig {
  const target = config ?? currentIdeWorkspaceConfig

  if (!target.workspace) {
    target.workspace = createDefaultConfig().workspace
  } else {
    if (target.workspace.enabled === undefined) target.workspace.enabled = false
    if (target.workspace.title === undefined) target.workspace.title = defaultWorkspaceTitle
    if (target.workspace.description === undefined) target.workspace.description = defaultWorkspaceDescription
    if (target.workspace.content === undefined) target.workspace.content = ''
    if (target.workspace.writable === undefined) target.workspace.writable = false
    if (target.workspace.commandable === undefined) target.workspace.commandable = false
  }

  if (!Array.isArray(target.projects)) {
    target.projects = []
  }

  target.projects.forEach((project) => {
    if (project.enabled === undefined) project.enabled = true
    if (project.description === undefined) project.description = ''
    if (project.content === undefined) project.content = ''
    if (project.writable === undefined) project.writable = false
    if (project.commandable === undefined) project.commandable = false
    if (!project.id) project.id = createProjectId()
    if (!project.name) project.name = getPathName(project.path || '')
  })

  return target
}

function hasText(value?: string) {
  return !!value?.trim()
}

function isWorkspaceConfigured(workspace: PathPermission) {
  return hasText(workspace.title) && hasText(workspace.description)
}

export function isWorkspaceAvailable(workspace = currentIdeWorkspaceConfig.workspace) {
  return workspace.enabled && isWorkspaceConfigured(workspace)
}

function isProjectConfigured(project: ProjectPermission) {
  return hasText(project.name) && hasText(project.description)
}

export function getIdeWorkspaceConfig() {
  return currentIdeWorkspaceConfig
}

export const workspaceVirtualPath = 'extra/workspace/'

export function getProjectVirtualPath(project: ProjectPermission, allProjects?: ProjectPermission[]) {
  const folderName = getPathName(project.path || project.id || createProjectId())
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'project'

  if (!allProjects) {
    return `extra/projects/${folderName}/`
  }

  // 统计同名文件夹名在当前项目之前出现的次数
  const idx = allProjects.indexOf(project)
  const sameNameBefore = allProjects
    .slice(0, idx < 0 ? undefined : idx)
    .filter((p) => {
      const n = getPathName(p.path || p.id || '')
        .replace(/[^\w.-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'project'
      return n === folderName
    }).length

  return sameNameBefore === 0
    ? `extra/projects/${folderName}/`
    : `extra/projects/${folderName}-${sameNameBefore + 1}/`
}

export function getEnabledProjectEntries(): EnabledProjectEntry[] {
  return currentIdeWorkspaceConfig.projects
    .map((project, index) => ({ project, index }))
    .filter(({ project }) => project.enabled && project.path && isProjectConfigured(project))
}

export function normalizeVirtualFilePath(filePath: string, virtualRoot: string) {
  const normalizedFilePath = filePath.replace(/\\/g, '/').replace(/\/+$/, '')
  const normalizedRoot = virtualRoot.replace(/\\/g, '/').replace(/\/+$/, '')
  if (normalizedFilePath === normalizedRoot) return ''
  return normalizedFilePath.startsWith(normalizedRoot + '/')
    ? normalizedFilePath.slice(normalizedRoot.length + 1)
    : normalizedFilePath
}

export function assertWorkspaceWriteAllowed() {
  const workspace = currentIdeWorkspaceConfig.workspace
  if (!isWorkspaceAvailable(workspace)) {
    throw new Error('已打开文件夹未开启读取权限，不能写入文件')
  }
  if (!workspace.writable) {
    throw new Error('已打开文件夹未开启写入权限')
  }
}

export function assertWorkspaceCommandAllowed() {
  const workspace = currentIdeWorkspaceConfig.workspace
  if (!isWorkspaceAvailable(workspace)) {
    throw new Error('已打开文件夹未开启读取权限，不能执行命令')
  }
  if (!workspace.commandable) {
    throw new Error('已打开文件夹未开启命令执行权限')
  }
}

function PermissionCheckbox({
  checked,
  label,
  onChange,
  disabled,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      className={`ide-folder-config-checkbox ${checked ? 'ide-folder-config-checkbox-on' : ''} ${disabled ? 'ide-folder-config-checkbox-disabled' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className="ide-folder-config-checkbox-box">
        <span className="ide-folder-config-checkbox-mark" />
      </span>
      <span className="ide-folder-config-checkbox-label">{label}</span>
    </button>
  )
}

function IdeWorkspaceConfigPanel({ data }: { data: IdeWorkspacePluginConfig }) {
  const [, forceUpdate] = useState(0)
  const [adding, setAdding] = useState(false)
  const [workspacePath, setWorkspacePath] = useState('')
  const vsCodeMsg = (window as any).webViewMessageApi
  const config = ensureConfig(data)

  useEffect(() => {
    currentIdeWorkspaceConfig = ensureConfig(data)
    forceUpdate((value) => value + 1)
  }, [data])

  useEffect(() => {
    let disposed = false
    if (!vsCodeMsg?.call) return

    vsCodeMsg.call('getIdeWorkspaceRoot')
      .then((res: { path?: string }) => {
        if (!disposed) setWorkspacePath(res?.path || '')
      })
      .catch(() => {
        if (!disposed) setWorkspacePath('')
      })

    return () => {
      disposed = true
    }
  }, [vsCodeMsg])

  const commit = () => {
    currentIdeWorkspaceConfig = ensureConfig(data)
    forceUpdate((value) => value + 1)
  }

  const updateWorkspace = (patch: Partial<PathPermission>) => {
    Object.assign(config.workspace, patch)
    commit()
  }

  const updateProject = (id: string, patch: Partial<ProjectPermission>) => {
    const project = config.projects.find((item) => item.id === id)
    if (!project) return
    Object.assign(project, patch)
    commit()
  }

  const removeProject = (id: string) => {
    const index = config.projects.findIndex((project) => project.id === id)
    if (index === -1) return
    config.projects.splice(index, 1)
    commit()
  }

  const addProject = async () => {
    if (!vsCodeMsg?.call) return
    setAdding(true)
    try {
      const res = await vsCodeMsg.call('selectIdeProjectDir')
      if (!res?.path) return
      if (config.projects.some((project) => project.path === res.path)) return

      config.projects.push({
        id: createProjectId(),
        path: res.path,
        name: '',
        enabled: true,
        description: '',
        content: '',
        writable: false,
        commandable: false,
      })
      commit()
    } finally {
      setAdding(false)
    }
  }

  const enabledProjectCount = config.projects.filter((project) => project.enabled).length
  const availableProjectCount = config.projects.filter((project) => project.enabled && isProjectConfigured(project)).length
  const workspaceIncomplete = config.workspace.enabled && !isWorkspaceConfigured(config.workspace)

  return (
    <div className="ide-folder-config-panel">
      <div className="ide-folder-config-desc">
        让AI能够读取、操作本地的文件夹路径，至少要开启读取权限，AI才能访问该路径下的文件。
      </div>

      <section className="ide-folder-config-card">
        <div className="ide-folder-config-row">
          <div className="ide-folder-config-info">
            <div className="ide-folder-config-section-title">工作区</div>
            <div className="ide-folder-config-path ide-folder-config-project-path">
              {workspacePath || '读取中...'}
            </div>
          </div>
          <div className="ide-folder-config-permissions">
            <PermissionCheckbox checked={config.workspace.enabled} label="读取" onChange={(checked) => updateWorkspace({ enabled: checked })} />
            <PermissionCheckbox checked={config.workspace.writable} label="写入" onChange={(checked) => updateWorkspace({ writable: checked })} />
            <PermissionCheckbox checked={config.workspace.commandable} label="命令行" onChange={(checked) => updateWorkspace({ commandable: checked })} />
          </div>
        </div>
        <input
          value={config.workspace.title || ''}
          placeholder="项目作用，必填。如：组件搭建 IDE、物料库源码"
          onChange={(event) => updateWorkspace({ title: event.target.value })}
          className="ide-folder-config-input"
        />
        <textarea
          value={config.workspace.description || ''}
          placeholder="补充说明，必填。让 AI 更好理解当前项目的职责、文件边界和注意事项"
          maxLength={300}
          onChange={(event) => updateWorkspace({ description: event.target.value })}
          className="ide-folder-config-textarea ide-folder-config-textarea-workspace"
        />
        <textarea
          value={config.workspace.content || ''}
          placeholder="agents.md 正文（可选）。AI 阅读此目录时会看到的详细说明，如关键架构、开发规范等"
          maxLength={1000}
          onChange={(event) => updateWorkspace({ content: event.target.value })}
          className="ide-folder-config-textarea ide-folder-config-textarea-workspace"
        />
        {workspaceIncomplete ? (
          <div className="ide-folder-config-warning">需要填写项目作用和补充说明，否则该路径不会作为可读取路径使用。</div>
        ) : null}
      </section>

      <section className="ide-folder-config-card">
        <div className="ide-folder-config-section-head" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div>
            <div className="ide-folder-config-section-title">其他项目</div>
          </div>
        </div>

        {config.projects.length === 0 ? (
          <div className="ide-folder-config-empty">
            还没有添加其他文件夹。添加后会映射到 extra/projects/ 下的虚拟目录。
          </div>
        ) : null}

        <div className="ide-folder-config-projects">
          {config.projects.map((project, index) => (
            <div key={project.id} className="ide-folder-config-project">
              {project.enabled && !isProjectConfigured(project) ? (
                <div className="ide-folder-config-warning ide-folder-config-project-warning">
                  需要填写项目作用和补充说明，否则该路径不会作为可读取路径使用。
                </div>
              ) : null}
              <div className="ide-folder-config-row">
                <div className="ide-folder-config-project-main">
                  <div className="ide-folder-config-project-title">
                    <FolderOpenOutlined />
                    <span>{getPathName(project.path)}</span>
                    <button
                      type="button"
                      title="移除项目"
                      onClick={() => removeProject(project.id)}
                      className="ide-folder-config-remove"
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                  <div className="ide-folder-config-path ide-folder-config-project-path">
                    {project.path}
                  </div>
                </div>
                <div className="ide-folder-config-permissions">
                  <PermissionCheckbox checked={project.enabled} label="读取" onChange={(checked) => updateProject(project.id, { enabled: checked })} />
                  <PermissionCheckbox checked={project.writable} label="写入" onChange={(checked) => updateProject(project.id, { writable: checked })} />
                  <PermissionCheckbox checked={project.commandable} label="命令行" onChange={(checked) => updateProject(project.id, { commandable: checked })} />
                </div>
              </div>
              <div className="ide-folder-config-project-editor">
                <div className="ide-folder-config-project-fields">
                  <input
                    value={project.name || ''}
                    placeholder="项目作用，必填。如：设计器源码、运行时包"
                    onChange={(event) => updateProject(project.id, { name: event.target.value })}
                    className="ide-folder-config-input"
                  />
                  <textarea
                    value={project.description || ''}
                    placeholder="补充说明，必填。让 AI 更好理解这个项目的职责、文件边界和注意事项"
                    maxLength={300}
                    onChange={(event) => updateProject(project.id, { description: event.target.value })}
                    className="ide-folder-config-textarea"
                  />
                  <textarea
                    value={project.content || ''}
                    placeholder="agents.md 正文（可选）。AI 阅读此目录时会看到的详细说明，如目录结构、关键文件、开发规范等"
                    maxLength={1000}
                    onChange={(event) => updateProject(project.id, { content: event.target.value })}
                    className="ide-folder-config-textarea"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          disabled={adding}
          onClick={addProject}
          className="ide-folder-config-add"
        >
          <FolderAddOutlined style={{ marginRight: 4 }} />
          {adding ? '选择中...' : '添加项目'}
        </button>
      </section>

      <div className="ide-folder-config-summary">
        <div className="ide-folder-config-summary-title">当前 AI 可以操作的本地目录如下：</div>
        {isWorkspaceAvailable(config.workspace) ? (
          <div className="ide-folder-config-aware-item">{workspaceVirtualPath}</div>
        ) : null}
        {config.projects
          .filter((project) => project.enabled && isProjectConfigured(project))
          .map((project) => (
            <div key={project.id} className="ide-folder-config-aware-item">
              {getProjectVirtualPath(project, config.projects)}
            </div>
          ))
        }
        {!isWorkspaceAvailable(config.workspace) && availableProjectCount === 0 ? (
          <div className="ide-folder-config-aware-item">暂无</div>
        ) : null}
      </div>
    </div>
  )
}

export function createIdeWorkspaceConfigPlugin() {
  const data = createDefaultConfig()

  return {
    name: IDE_WORKSPACE_PLUGIN_NAME,
    namespace: IDE_WORKSPACE_PLUGIN_NAME,
    title: '文件夹配置',
    description: '配置本地文件夹路径的读取、写入和命令执行权限',
    data,
    onLoad({ data }: { data?: IdeWorkspacePluginConfig }) {
      currentIdeWorkspaceConfig = ensureConfig(data ?? currentIdeWorkspaceConfig)
    },
    contributes: {
      sliderView: {
        tab: {
          title: '文件夹',
          icon: <FolderOpenOutlined />,
          apiSet: [],
          render(params: any) {
            const panelData = params?.data ?? data
            currentIdeWorkspaceConfig = ensureConfig(panelData)
            return <IdeWorkspaceConfigPanel data={panelData} />
          },
        },
      },
    },
  }
}
