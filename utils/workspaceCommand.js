const path = require('path')
const os = require('os')
const { spawn } = require('child_process')
const { getWorkspaceRoot, isPathInsideRoot } = require('./workspaceFiles')

/**
 * 补全 PATH，确保 npm/yarn/pnpm 等 shell 脚本能被找到。
 * VSCode 扩展进程的 PATH 可能不包含用户 shell 初始化（nvm/fnm/homebrew）配置的路径。
 */
function resolveEnv() {
  const extraPaths = [
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    path.join(os.homedir(), '.nvm', 'versions', 'node', 'current', 'bin'),
    path.join(os.homedir(), '.fnm', 'aliases', 'default', 'bin'),
    '/opt/homebrew/bin',
    '/opt/homebrew/sbin',
  ]
  const existing = (process.env.PATH || '').split(path.delimiter)
  const merged = [...new Set([...existing, ...extraPaths])].join(path.delimiter)
  return { ...process.env, PATH: merged }
}

const ALLOWED_COMMANDS = new Set(['npm', 'npx', 'yarn', 'pnpm', 'bun', 'nest'])
const DEFAULT_TIMEOUT_MS = 120000
const MAX_TIMEOUT_MS = 300000
const MAX_OUTPUT_CHARS = 60000

function parseCommand(command) {
  const input = String(command || '').trim()
  const args = []
  let current = ''
  let quote = null
  let escaping = false

  for (const char of input) {
    if (escaping) {
      current += char
      escaping = false
      continue
    }
    if (char === '\\') {
      escaping = true
      continue
    }
    if (quote) {
      if (char === quote) {
        quote = null
      } else {
        current += char
      }
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (/\s/.test(char)) {
      if (current) {
        args.push(current)
        current = ''
      }
      continue
    }
    current += char
  }

  if (escaping) current += '\\'
  if (quote) throw new Error('命令引号未闭合')
  if (current) args.push(current)
  return args
}

function normalizeCommandName(commandName) {
  return path.basename(commandName).replace(/\.(cmd|exe)$/i, '')
}

function validateCommand(parts) {
  if (!parts.length) throw new Error('缺少 command 参数')

  const commandName = parts[0]
  if (/[\\/]/.test(commandName)) {
    throw new Error('命令入口不能包含路径')
  }

  const normalized = normalizeCommandName(commandName)
  if (!ALLOWED_COMMANDS.has(normalized)) {
    throw new Error(`不允许执行 ${commandName}，仅支持 ${Array.from(ALLOWED_COMMANDS).join(' / ')}`)
  }
}

function trimOutput(output) {
  if (output.length <= MAX_OUTPUT_CHARS) return output
  return `${output.slice(0, MAX_OUTPUT_CHARS)}\n\n[output truncated, total ${output.length} chars]`
}

function resolveWorkdir(workdir, root) {
  if (!workdir || !String(workdir).trim()) {
    throw new Error('workdir is required')
  }
  // 拒绝绝对路径，只接受相对路径
  if (path.isAbsolute(workdir)) {
    throw new Error('workdir 不能是绝对路径，请使用相对于工作区根目录的路径，例如 "." 或 "server" 或 "packages/api"')
  }
  const resolved = path.resolve(root, workdir)
  // 安全边界：必须在工作区根目录内
  if (!isPathInsideRoot(root, resolved)) {
    throw new Error(`workdir 超出项目范围：${workdir}`)
  }
  return resolved
}

function runCommandInRoot(root, command, timeoutMs, workdir) {
  let parts
  let cwd
  try {
    parts = parseCommand(command)
    validateCommand(parts)
    cwd = resolveWorkdir(workdir, root)
  } catch (err) {
    return Promise.resolve({ error: err.message || String(err) })
  }

  const timeout = Math.min(
    Math.max(Number(timeoutMs) || DEFAULT_TIMEOUT_MS, 1000),
    MAX_TIMEOUT_MS,
  )
  const [bin, ...args] = parts

  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let settled = false
    const child = spawn(bin, args, {
      cwd,
      shell: true,
      env: resolveEnv(),
    })

    const timer = setTimeout(() => {
      if (settled) return
      child.kill('SIGTERM')
      settled = true
      resolve({
        ok: false,
        command,
        cwd,
        exitCode: null,
        signal: 'SIGTERM',
        timedOut: true,
        stdout: trimOutput(stdout),
        stderr: trimOutput(stderr),
      })
    }, timeout)

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('error', (err) => {
      if (settled) return
      clearTimeout(timer)
      settled = true
      resolve({ error: err.message || String(err) })
    })
    child.on('close', (exitCode, signal) => {
      if (settled) return
      clearTimeout(timer)
      settled = true
      resolve({
        ok: exitCode === 0,
        command,
        cwd,
        exitCode,
        signal,
        timedOut: false,
        stdout: trimOutput(stdout),
        stderr: trimOutput(stderr),
      })
    })
  })
}

function runWorkspaceCommand(command, timeoutMs, workdir) {
  return runCommandInRoot(getWorkspaceRoot(), command, timeoutMs, workdir)
}

module.exports = {
  ALLOWED_COMMANDS,
  runCommandInRoot,
  runWorkspaceCommand,
}
