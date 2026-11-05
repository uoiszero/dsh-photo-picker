import { createReadStream } from 'node:fs'
import { access, opendir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fromPortablePath } from './platform.js'

const FORMATS = new Map([
  ['.jpg', 'jpeg'], ['.jpeg', 'jpeg'], ['.jpe', 'jpeg'],
  ['.png', 'png'], ['.webp', 'webp'],
  ['.heic', 'heic'], ['.heif', 'heic'], ['.avif', 'heic'],
  ['.dng', 'raw'], ['.cr2', 'raw'], ['.cr3', 'raw'], ['.nef', 'raw'],
  ['.arw', 'raw'], ['.raf', 'raw'], ['.orf', 'raw'], ['.rw2', 'raw'],
])

/** 扩展名 → 内部格式名；不支持返回 undefined。 */
export function formatOf(filePath) {
  return FORMATS.get(path.extname(filePath).toLowerCase())
}

/** 本机目录照片源：只读，不跟随符号链接。 */
export class LocalSource {
  constructor(root) {
    this.kind = 'local'
    this.root = path.resolve(root)
  }

  async health() {
    try {
      await access(this.root)
      return true
    } catch {
      return false
    }
  }

  async stat(relPath) {
    return stat(this.absolute(relPath))
  }

  openRead(relPath) {
    return createReadStream(this.absolute(relPath))
  }

  absolute(relPath) {
    return fromPortablePath(this.root, relPath)
  }

  async has(relPath) {
    try {
      await stat(this.absolute(relPath))
      return true
    } catch {
      return false
    }
  }

  /** 递归列出所有普通文件；`format` 为 undefined 表示不是支持的图片。 */
  async *walk() {
    const stack = ['']
    while (stack.length > 0) {
      const rel = stack.pop()
      const dir = await opendir(this.absolute(rel))
      for await (const entry of dir) {
        if (entry.name.startsWith('.')) continue
        const childRel = rel === '' ? entry.name : `${rel}/${entry.name}`
        if (entry.isSymbolicLink()) continue
        if (entry.isDirectory()) {
          stack.push(childRel)
          continue
        }
        if (!entry.isFile()) continue
        yield { relPath: childRel, format: formatOf(entry.name) }
      }
    }
  }
}
