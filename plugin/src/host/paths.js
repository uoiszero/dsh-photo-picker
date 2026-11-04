import os from 'node:os'
import path from 'node:path'

/** DSH home；web profile 启动时也会注入 DSH_HOME。 */
export function dshHome() {
  return process.env.DSH_HOME ?? path.join(os.homedir(), '.dsh')
}

/** 工作台自己的存储目录（注册表、将来的全局缓存）。 */
export function workbenchStoreDir() {
  return path.join(dshHome(), 'storages', 'photo-picker')
}

/** 默认的项目工作区根目录。 */
export function defaultWorkspaceRoot() {
  return path.join(os.homedir(), 'Pictures', 'PhotoPicker')
}

/** 文件名安全化，用于默认项目目录。 */
export function slugify(name) {
  const slug = String(name).trim().toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return slug.length > 0 ? slug : 'photo-project'
}
