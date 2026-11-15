import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const MOUNT_ROOT = '/Volumes'

/** 解析 smb://[user@]host/share[.subpath]；拒绝带密码的 URL。 */
export function parseSmbUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.startsWith('smb://')) {
    const error = new Error('SMB URL must start with smb://')
    error.code = 'BAD_SMB_URL'
    error.statusCode = 400
    throw error
  }
  let url
  try {
    url = new URL(rawUrl)
  } catch {
    const error = new Error(`invalid SMB URL: ${rawUrl}`)
    error.code = 'BAD_SMB_URL'
    error.statusCode = 400
    throw error
  }
  if (url.password !== '') {
    const error = new Error('do not put passwords in SMB URLs; use the system login dialog')
    error.code = 'SMB_PASSWORD_IN_URL'
    error.statusCode = 400
    throw error
  }
  const segments = url.pathname.split('/').filter(Boolean).map(segment => decodeURIComponent(segment))
  if (url.hostname === '' || segments.length === 0) {
    const error = new Error('SMB URL needs a host and share, e.g. smb://nas/photos')
    error.code = 'BAD_SMB_URL'
    error.statusCode = 400
    throw error
  }
  const [share, ...rest] = segments
  return {
    host: url.hostname,
    share,
    subPath: rest.join('/'),
    username: url.username === '' ? null : decodeURIComponent(url.username),
    // 不把密码、查询参数或 fragment 带进持久化 URL / open 调用。
    openUrl: `smb://${url.username === '' ? '' : `${encodeURIComponent(decodeURIComponent(url.username))}@`}${url.hostname}/${segments.map(encodeURIComponent).join('/')}`,
    canonicalUrl: `smb://${url.hostname}/${segments.map(encodeURIComponent).join('/')}`,
  }
}

export async function defaultListVolumes() {
  const names = await readdir(MOUNT_ROOT, { withFileTypes: true })
  return names.filter(entry => entry.isDirectory() && !entry.name.startsWith('.')).map(entry => entry.name)
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 让系统打开 SMB URL（Finder/Keychain 负责登录），轮询 /Volumes 等待挂载。
 * 依赖通过参数注入，便于不依赖真实 NAS 的单元测试。
 */
export async function connectSmb({
  rawUrl,
  platform,
  listVolumes = defaultListVolumes,
  sleep = wait,
  timeoutMs = 90_000,
  intervalMs = 1_000,
  mountRoot = MOUNT_ROOT,
} = {}) {
  const parsed = parseSmbUrl(rawUrl)
  if (platform === undefined || typeof platform.openUrl !== 'function') {
    throw new Error('platform.openUrl is required')
  }

  const before = new Set(await listVolumes())
  const already = before.has(parsed.share)
  if (!already) {
    await platform.openUrl(parsed.openUrl)
    const attempts = Math.max(1, Math.ceil(timeoutMs / intervalMs))
    for (let i = 0; i < attempts; i += 1) {
      await sleep(intervalMs)
      const names = await listVolumes()
      const candidate = names.find(name => name === parsed.share)
        ?? names.find(name => !before.has(name))
      if (candidate === undefined) continue
      const mountPoint = path.join(mountRoot, candidate)
      try {
        const info = await stat(mountPoint)
        if (!info.isDirectory()) continue
      } catch {
        continue
      }
      return {
        mounted: true,
        mountPoint,
        sourcePath: parsed.subPath === '' ? mountPoint : path.join(mountPoint, ...parsed.subPath.split('/')),
        share: parsed.share,
        url: parsed.canonicalUrl,
        username: parsed.username,
      }
    }
    const error = new Error(`SMB mount did not appear within ${Math.round(timeoutMs / 1000)}s: ${parsed.share}`)
    error.code = 'MOUNT_TIMEOUT'
    error.statusCode = 408
    throw error
  }

  const mountPoint = path.join(mountRoot, parsed.share)
  const info = await stat(mountPoint).catch(() => undefined)
  if (info === undefined || !info.isDirectory()) {
    const error = new Error(`SMB share is not mounted: ${parsed.share}`)
    error.code = 'MOUNT_NOT_FOUND'
    error.statusCode = 404
    throw error
  }
  return {
    mounted: true,
    mountPoint,
    sourcePath: parsed.subPath === '' ? mountPoint : path.join(mountPoint, ...parsed.subPath.split('/')),
    share: parsed.share,
    url: parsed.canonicalUrl,
    username: parsed.username,
  }
}
