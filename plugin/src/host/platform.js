import { execFile, spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const defaultRun = promisify(execFile)

/**
 * WIC（Windows Imaging Component）解码脚本：把 HEIC/RAW 等 sharp 读不了的格式
 * 转成临时 JPEG。依赖系统已安装的 HEIF/RAW 扩展；缺扩展时由调用方记为 unreadable。
 */
const WIC_DECODE = `param([string]$In, [string]$Out)
Add-Type -AssemblyName PresentationCore
$stream = [System.IO.File]::OpenRead($In)
try {
  $decoder = [System.Windows.Media.Imaging.BitmapDecoder]::Create(
    $stream,
    [System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,
    [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
  $encoder = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
  $encoder.QualityLevel = 92
  $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($decoder.Frames[0]))
  $output = [System.IO.File]::Create($Out)
  try { $encoder.Save($output) } finally { $output.Dispose() }
} finally { $stream.Dispose() }
`

const WIC_SIZE = `param([string]$In)
Add-Type -AssemblyName PresentationCore
$stream = [System.IO.File]::OpenRead($In)
try {
  $decoder = [System.Windows.Media.Imaging.BitmapDecoder]::Create(
    $stream,
    [System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,
    [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
  $frame = $decoder.Frames[0]
  [Console]::Out.Write(("{0}x{1}" -f $frame.PixelWidth, $frame.PixelHeight))
} finally { $stream.Dispose() }
`

const FOLDER_PICKER = `Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'Select photo folder'
$dialog.ShowNewFolderButton = $true
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  [Console]::Out.Write($dialog.SelectedPath)
}
`

function unsupported(what, platformName) {
  const error = new Error(`${what} is not supported on platform: ${platformName}`)
  error.code = 'UNSUPPORTED_PLATFORM'
  return error
}

/** 取 stdout 的最后一行并去掉 shell 可能带上的引号。 */
export function parseChosenPath(stdout) {
  const lines = String(stdout ?? '').split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  if (lines.length === 0) return ''
  return lines[lines.length - 1].replace(/^["']|["']$/g, '').trim()
}

/** 统一的平台适配层；所有副作用都通过注入的 run/spawn 执行，便于单测。 */
export function createPlatform({
  platform = process.platform,
  run = defaultRun,
  spawnProcess = spawn,
} = {}) {
  const name = platform
  const isMac = name === 'darwin'
  const isWindows = name === 'win32'

  async function withTempScript(script, fn) {
    const dir = await mkdtemp(path.join(tmpdir(), 'pp-win-'))
    const file = path.join(dir, 'task.ps1')
    await writeFile(file, script)
    try {
      return await fn({ dir, file })
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  }

  async function decodeToJpeg(filePath) {
    if (isMac) {
      const dir = await mkdtemp(path.join(tmpdir(), 'pp-decode-'))
      const out = path.join(dir, 'preview.jpg')
      try {
        await run(
          'sips',
          ['-s', 'format', 'jpeg', '--resampleWidth', '1600', filePath, '--out', out],
          { timeout: 120_000 },
        )
        return { path: out, cleanup: () => rm(dir, { recursive: true, force: true }) }
      } catch (error) {
        await rm(dir, { recursive: true, force: true })
        throw error
      }
    }
    if (isWindows) {
      // 临时目录要留到调用方读完 JPEG 之后再清理。
      const dir = await mkdtemp(path.join(tmpdir(), 'pp-win-'))
      const file = path.join(dir, 'decode.ps1')
      const out = path.join(dir, 'preview.jpg')
      try {
        await writeFile(file, WIC_DECODE)
        await run(
          'powershell.exe',
          ['-NoProfile', '-NonInteractive', '-STA', '-ExecutionPolicy', 'Bypass', '-File', file, '-In', filePath, '-Out', out],
          { timeout: 120_000 },
        )
        return { path: out, cleanup: () => rm(dir, { recursive: true, force: true }) }
      } catch (error) {
        await rm(dir, { recursive: true, force: true })
        throw error
      }
    }
    throw unsupported('HEIC/RAW decoding', name)
  }

  async function imageSize(filePath) {
    if (isMac) {
      const { stdout } = await run(
        'sips',
        ['-g', 'pixelWidth', '-g', 'pixelHeight', filePath],
        { timeout: 60_000 },
      )
      return {
        width: Number(/pixelWidth:\s*(\d+)/.exec(stdout)?.[1] ?? 0),
        height: Number(/pixelHeight:\s*(\d+)/.exec(stdout)?.[1] ?? 0),
      }
    }
    if (isWindows) {
      return await withTempScript(WIC_SIZE, async ({ file }) => {
        const { stdout } = await run(
          'powershell.exe',
          ['-NoProfile', '-NonInteractive', '-STA', '-ExecutionPolicy', 'Bypass', '-File', file, '-In', filePath],
          { timeout: 60_000 },
        )
        const match = /(\d+)x(\d+)/.exec(stdout ?? '')
        return {
          width: Number(match?.[1] ?? 0),
          height: Number(match?.[2] ?? 0),
        }
      })
    }
    throw unsupported('image size probe', name)
  }

  async function chooseFolder() {
    if (isMac) {
      const { stdout } = await run(
        'osascript',
        ['-e', 'POSIX path of (choose folder)'],
        { timeout: 120_000 },
      )
      const selected = parseChosenPath(stdout)
      if (selected === '') throw new Error('no folder selected')
      return selected
    }
    if (isWindows) {
      const selected = await withTempScript(FOLDER_PICKER, async ({ file }) => {
        const { stdout } = await run(
          'powershell.exe',
          ['-NoProfile', '-NonInteractive', '-STA', '-ExecutionPolicy', 'Bypass', '-File', file],
          { timeout: 120_000 },
        )
        return parseChosenPath(stdout)
      })
      if (selected === '') throw new Error('no folder selected')
      return selected
    }
    throw unsupported('native folder picker', name)
  }

  async function revealPath(target, isDirectory = false) {
    if (isMac) {
      await run('open', isDirectory ? [target] : ['-R', target], { timeout: 30_000 })
      return
    }
    if (isWindows) {
      // explorer.exe 在成功时也可能返回 1，必须 detached 且忽略输出。
      const child = spawnProcess(
        'explorer.exe',
        [isDirectory ? target : `/select,${target}`],
        { detached: true, stdio: 'ignore' },
      )
      child?.unref?.()
      return
    }
    await run('xdg-open', [isDirectory ? target : path.dirname(target)], { timeout: 30_000 })
  }

  return { name, isMac, isWindows, decodeToJpeg, imageSize, chooseFolder, revealPath }
}

export const platform = createPlatform()

/** 按目标平台选择 path 实现；测试 Windows 路径时不受宿主 OS 影响。 */
export function pathApi(platformName = process.platform) {
  return platformName === 'win32' ? path.win32 : path.posix
}

/** 用于比较的规范化路径：Windows 大小写不敏感，并去掉末尾分隔符（根除外）。 */
export function canonicalPathKey(target, platformName = process.platform) {
  const api = pathApi(platformName)
  let key = api.normalize(String(target))
  const root = api.parse(key).root
  if (key.length > root.length) key = key.replace(/[\\/]+$/, '')
  return platformName === 'win32' ? key.toLowerCase() : key
}

/** parent 是否等于或包含 child；Windows 盘符/UNC 与大小写都按平台处理。 */
export function isSameOrInside(parent, child, platformName = process.platform) {
  const api = pathApi(platformName)
  const parentKey = canonicalPathKey(parent, platformName)
  const childKey = canonicalPathKey(child, platformName)
  if (parentKey === childKey) return true
  const separator = api.sep
  const prefix = parentKey.endsWith(separator) ? parentKey : `${parentKey}${separator}`
  return childKey.startsWith(prefix)
}

/** 数据库和 manifest 一律存 `/` 分隔，避免 Windows 反斜杠写进相对路径。 */
export function toPortablePath(target) {
  return String(target).replace(/\\/g, '/')
}

/** 把可移植的相对路径拼回宿主/目标平台绝对路径。 */
export function fromPortablePath(root, relative, platformName = process.platform) {
  const api = pathApi(platformName)
  const parts = String(relative).replace(/\\/g, '/').split('/').filter(part => part !== '')
  return api.join(root, ...parts)
}
