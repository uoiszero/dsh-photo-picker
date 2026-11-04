import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { workbenchStoreDir } from './paths.js'

const EMPTY = { version: 1, projects: [] }

export function registryPath() {
  return path.join(workbenchStoreDir(), 'registry.json')
}

export function readRegistry(file = registryPath()) {
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    if (parsed === null || typeof parsed !== 'object' || !Array.isArray(parsed.projects)) {
      return structuredClone(EMPTY)
    }
    return parsed
  } catch (error) {
    if (error?.code === 'ENOENT') return structuredClone(EMPTY)
    throw error
  }
}

export function writeRegistry(value, file = registryPath()) {
  mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8')
  renameSync(tmp, file)
}
