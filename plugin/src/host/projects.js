import { access, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import { closeDb, openDb } from './db.js'
import { defaultWorkspaceRoot, slugify } from './paths.js'
import { readRegistry, writeRegistry } from './registry.js'

export function toProject(row) {
  return {
    id: row.id,
    name: row.name,
    workspaceDir: row.workspace_dir,
    sourceKind: row.source_kind,
    sourcePath: row.source_path,
    mountPoint: row.mount_point ?? null,
    sourceReadonly: row.source_readonly === 1,
    theme: row.theme,
    modelRoute: row.model_route,
    modelId: row.model_id,
    budgetCny: row.budget_cny,
    concurrency: row.concurrency,
    offpeakOnly: row.offpeak_only === 1,
    gridCols: row.grid_cols,
    gridRows: row.grid_rows,
    thresholdKeep: row.threshold_keep,
    thresholdMaybe: row.threshold_maybe,
    stagePause: row.stage_pause === 1,
    groupBurstSeconds: row.group_burst_seconds,
    groupBurstHamming: row.group_burst_hamming,
    groupSceneSeconds: row.group_scene_seconds,
    groupSceneHamming: row.group_scene_hamming,
    promptVersion: row.prompt_version,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** 项目注册表 + 每个项目 SQLite 句柄的惰性缓存。 */
export class ProjectStore {
  constructor({ dshHome, workspaceRoot = defaultWorkspaceRoot() } = {}) {
    this.dshHome = dshHome
    this.workspaceRoot = workspaceRoot
    this.handles = new Map()
  }

  registryFile() {
    return this.dshHome === undefined
      ? undefined
      : path.join(this.dshHome, 'storages', 'photo-picker', 'registry.json')
  }

  async list() {
    const registry = readRegistry(this.registryFile())
    return [...registry.projects].sort((a, b) => b.createdAt - a.createdAt)
  }

  async create({ source, name, theme = 'mixed', budgetCny = 30, workspaceDir } = {}) {
    if (source?.kind !== 'local') throw new Error('only local sources are supported in plan 1')
    const sourcePath = path.resolve(String(source.path))
    let sourceStat
    try {
      sourceStat = await stat(sourcePath)
    } catch {
      throw new Error(`source path does not exist: ${sourcePath}`)
    }
    if (!sourceStat.isDirectory()) throw new Error(`source path is not a directory: ${sourcePath}`)
    await access(sourcePath)

    const projectName = (name ?? path.basename(sourcePath)).trim() || path.basename(sourcePath)
    const id = nanoid()
    const workspace = workspaceDir === undefined
      ? await this.uniqueWorkspace(projectName)
      : path.resolve(workspaceDir)

    await mkdir(workspace, { recursive: true })
    for (const dir of ['thumbs', 'previews', 'grids', 'logs']) {
      await mkdir(path.join(workspace, dir), { recursive: true })
    }

    const db = openDb(workspace)
    const now = Date.now()
    try {
      db.prepare(`
        INSERT INTO projects (
          id, name, workspace_dir, source_kind, source_path, theme,
          budget_cny, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, projectName, workspace, 'local', sourcePath, theme, budgetCny, now, now)
      const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
      const registry = readRegistry(this.registryFile())
      registry.projects.push({
        id,
        name: projectName,
        workspaceDir: workspace,
        sourceKind: 'local',
        sourcePath,
        createdAt: now,
      })
      writeRegistry(registry, this.registryFile())
      this.handles.set(id, { db, project: toProject(row) })
      return toProject(row)
    } catch (error) {
      closeDb(db)
      throw error
    }
  }

  async uniqueWorkspace(name) {
    const base = path.join(this.workspaceRoot, slugify(name))
    for (let i = 1; i < 1000; i++) {
      const candidate = i === 1 ? base : `${base}-${i}`
      try {
        await stat(candidate)
      } catch {
        return candidate
      }
    }
    throw new Error('cannot allocate a workspace directory')
  }

  async open(id) {
    const cached = this.handles.get(id)
    if (cached !== undefined) return cached
    const registry = readRegistry(this.registryFile())
    const entry = registry.projects.find(project => project.id === id)
    if (entry === undefined) throw new Error(`unknown project: ${id}`)
    const db = openDb(entry.workspaceDir)
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
    if (row === undefined) throw new Error(`project database is missing row: ${id}`)
    const handle = { db, project: toProject(row) }
    this.handles.set(id, handle)
    return handle
  }

  async get(id) {
    const { project } = await this.open(id)
    return project
  }

  close(id) {
    const cached = this.handles.get(id)
    if (cached === undefined) return
    closeDb(cached.db)
    this.handles.delete(id)
  }
}
