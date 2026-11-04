import { Service } from '@deepseek-ai/cordis'
import { EventEmitter } from 'node:events'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createHttpHandler } from './http.js'
import { dshHome } from './paths.js'
import { ProjectStore, toProject } from './projects.js'
import { preprocessProject } from './preprocess.js'
import { scanProject } from './scan.js'
import { LocalSource } from './source.js'
import { createPhotoPickerTool } from './tools.js'

const execFileAsync = promisify(execFile)

/** 照片工作台的 Host 服务；Client 与 agent 工具共用这一份状态。 */
export class PhotoPickerService extends Service {
  static inject = ['tools', 'webServer']

  constructor(ctx) {
    super(ctx, 'photoPicker')
    this.ctx = ctx
    this.store = new ProjectStore({ dshHome: dshHome() })
    this.events = new EventEmitter()
    this.running = new Map()
    ctx.effect(
      () => ctx.webServer.register({
        kind: 'prefix',
        path: '/photo-picker',
        handler: createHttpHandler(this),
      }),
      'photo-picker.http',
    )
    ctx.effect(() => ctx.tools.register(createPhotoPickerTool(this)), 'photo-picker.tool')
  }

  async listProjects() {
    const entries = await this.store.list()
    return Promise.all(entries.map(entry => this.getProjectDetail(entry.id)))
  }

  async createProject(input) {
    const project = await this.store.create(input)
    return this.getProjectDetail(project.id)
  }

  async resolveProject(ref) {
    if (this.store.handles.has(ref)) return ref
    const entries = await this.store.list()
    const match = entries.find(entry => entry.name === ref || entry.id === ref)
    if (match === undefined) throw new Error(`unknown project: ${ref}`)
    return match.id
  }

  async getProjectDetail(id) {
    const { db } = await this.store.open(id)
    // 阶段会直接改 projects 行，句柄里的快照可能已过期，这里每次重新读。
    const fresh = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
    if (fresh === undefined) throw new Error(`unknown project: ${id}`)
    const project = toProject(fresh)
    const counts = Object.fromEntries(
      db.prepare('SELECT state, COUNT(*) AS n FROM photos WHERE project_id = ? GROUP BY state')
        .all(id).map(row => [row.state, row.n]),
    )
    const stages = db.prepare(`
      SELECT stage, status, stats_json, started_at, finished_at FROM stage_runs
      WHERE project_id = ? ORDER BY started_at DESC LIMIT 8
    `).all(id).map(row => {
      let stats = null
      try { stats = row.stats_json === null ? null : JSON.parse(row.stats_json) } catch { stats = null }
      return { stage: row.stage, status: row.status, stats, startedAt: row.started_at, finishedAt: row.finished_at }
    })
    return { ...project, counts, stages, running: this.running.get(id) ?? null }
  }

  async listPhotos(id, { state, limit = 60, offset = 0 } = {}) {
    const { db } = await this.store.open(id)
    const clauses = ['project_id = ?']
    const params = [id]
    if (state !== undefined) {
      clauses.push('state = ?')
      params.push(state)
    }
    const rows = db.prepare(`
      SELECT id, rel_path, state, width, height, blur_score, dhash, group_id FROM photos
      WHERE ${clauses.join(' AND ')}
      ORDER BY rel_path LIMIT ? OFFSET ?
    `).all(...params, limit, offset)
    return rows.map(row => ({
      id: row.id,
      relPath: row.rel_path,
      state: row.state,
      width: row.width,
      height: row.height,
      blurScore: row.blur_score,
      groupId: row.group_id,
      thumbUrl: `/photo-picker/media/thumb/${id}/${row.id}`,
    }))
  }

  async thumbFile(id, photoId) {
    const { db, project } = await this.store.open(id)
    const row = db.prepare('SELECT thumb_path FROM photos WHERE id = ? AND project_id = ?').get(photoId, id)
    if (row === undefined || row.thumb_path === null) return undefined
    return path.join(project.workspaceDir, row.thumb_path)
  }

  async startStage(id, stage) {
    if (stage !== 'scan' && stage !== 'preprocess') throw new Error(`unsupported stage: ${stage}`)
    if (this.running.has(id)) throw new Error(`a stage is already running for project ${id}`)
    const { db, project } = await this.store.open(id)
    const source = new LocalSource(project.sourcePath)
    const onProgress = progress => this.events.emit('event', { projectId: id, ...progress })
    const task = stage === 'scan'
      ? scanProject({ db, projectId: id, source, onProgress })
      : preprocessProject({
          db,
          projectId: id,
          sourceRoot: project.sourcePath,
          workspaceDir: project.workspaceDir,
          onProgress,
        })
    this.running.set(id, stage)
    task
      .then(() => this.events.emit('event', { projectId: id, stage, done: true }))
      .catch(error => this.events.emit('event', { projectId: id, stage, error: String(error?.message ?? error) }))
      .finally(() => this.running.delete(id))
    return { started: stage }
  }

  async chooseFolder() {
    const { stdout } = await execFileAsync(
      'osascript',
      ['-e', 'POSIX path of (choose folder)'],
      { timeout: 120_000 },
    )
    const selected = stdout.trim()
    if (selected === '') throw new Error('no folder selected')
    return selected
  }

  async listDir(dir) {
    const target = dir === undefined || dir === '' ? os.homedir() : path.resolve(dir)
    const entries = await readdir(target, { withFileTypes: true })
    return entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .map(entry => ({ name: entry.name, path: path.join(target, entry.name) }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
}
