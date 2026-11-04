import { Service } from '@deepseek-ai/cordis'
import { EventEmitter } from 'node:events'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, readdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createHttpHandler } from './http.js'
import { dshHome } from './paths.js'
import { isPeakHour } from './cost.js'
import { previewExport, runExport } from './export.js'
import { renderPreview } from './images.js'
import { runGridStage, runRankStage, runScoreStage } from './pipeline.js'
import { ProjectStore, toProject } from './projects.js'
import {
  computeCalibration, lastCalibrationReport, sampleCalibration, saveCalibrationReport,
} from './calibration.js'
import {
  getPhotoDetail, groupDetail, listGroups, listReviewPhotos, projectStats, setHumanDecisions,
} from './review.js'
import { preprocessProject } from './preprocess.js'
import {
  GRID_SYSTEM, PROMPT_VERSION, RANK_SYSTEM, SCORE_SYSTEM,
  gridUserPrompt, rankUserPrompt, scoreUserPrompt,
} from './prompts.js'
import { scanProject } from './scan.js'
import { LocalSource } from './source.js'
import { createPhotoPickerExportTool, createPhotoPickerTool } from './tools.js'

const execFileAsync = promisify(execFile)
const STAGES = new Set(['scan', 'preprocess', 'grid', 'rank', 'score'])
const AI_STAGES = new Set(['grid', 'rank', 'score'])

function stageError(message, code, statusCode) {
  const error = new Error(message)
  error.code = code
  error.statusCode = statusCode
  return error
}

/** 照片工作台的 Host 服务；Client 与 agent 工具共用这一份状态。 */
export class PhotoPickerService extends Service {
  static inject = ['tools', 'webServer', 'llm', 'attachments']

  constructor(ctx) {
    super(ctx, 'photoPicker')
    this.ctx = ctx
    this.store = new ProjectStore({ dshHome: dshHome() })
    this.events = new EventEmitter()
    this.running = new Map()
    this.imageModelCache = new Map()
    ctx.effect(
      () => ctx.webServer.register({
        kind: 'prefix',
        path: '/photo-picker',
        handler: createHttpHandler(this),
      }),
      'photo-picker.http',
    )
    ctx.effect(() => ctx.tools.register(createPhotoPickerTool(this)), 'photo-picker.tool')
    ctx.effect(() => ctx.tools.register(createPhotoPickerExportTool(this)), 'photo-picker.export-tool')
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

  /** 检查路由是否声明了图片输入；缓存结果，避免每次详情都查模型目录。 */
  async imageCapable(project) {
    const key = `${project.modelRoute}/${project.modelId}`
    if (this.imageModelCache.has(key)) return this.imageModelCache.get(key)
    let capable = true
    try {
      const models = await this.ctx.llm.listModels(project.modelRoute)
      const model = models.find(entry => entry.id === project.modelId)
      if (model !== undefined && Array.isArray(model.inputModalities)) {
        capable = model.inputModalities.includes('image')
      }
    } catch {
      capable = true
    }
    this.imageModelCache.set(key, capable)
    return capable
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
      SELECT stage, status, stats_json, cost_cny, started_at, finished_at FROM stage_runs
      WHERE project_id = ? ORDER BY started_at DESC LIMIT 8
    `).all(id).map(row => {
      let stats = null
      try { stats = row.stats_json === null ? null : JSON.parse(row.stats_json) } catch { stats = null }
      return {
        stage: row.stage, status: row.status, stats, costCny: row.cost_cny,
        startedAt: row.started_at, finishedAt: row.finished_at,
      }
    })
    const spent = db.prepare('SELECT COALESCE(SUM(cost_cny), 0) AS spent FROM stage_runs WHERE project_id = ?').get(id).spent
    return {
      ...project,
      counts,
      stages,
      cost: { spentCny: spent, budgetCny: project.budgetCny },
      ai: { hasImageModel: await this.imageCapable(project), model: project.modelId },
      running: this.running.get(id)?.stage ?? null,
    }
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
      SELECT id, rel_path, state, width, height, blur_score, dhash, group_id, thumb_path FROM photos
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
      hasThumb: row.thumb_path !== null,
      thumbUrl: `/photo-picker/media/thumb/${id}/${row.id}`,
    }))
  }

  async thumbFile(id, photoId) {
    const { db, project } = await this.store.open(id)
    const row = db.prepare('SELECT thumb_path FROM photos WHERE id = ? AND project_id = ?').get(photoId, id)
    if (row === undefined || row.thumb_path === null) return undefined
    return path.join(project.workspaceDir, row.thumb_path)
  }

  /** 阶段统计与抽样（检查点卡片）。 */
  async checkpoints(id) {
    const { db } = await this.store.open(id)
    const result = []
    for (const stage of ['scan', 'preprocess', 'grid', 'rank', 'score']) {
      const row = db.prepare(`
        SELECT * FROM stage_runs WHERE project_id = ? AND stage = ?
        ORDER BY started_at DESC LIMIT 1
      `).get(id, stage)
      if (row === undefined) continue
      let stats = null
      try { stats = row.stats_json === null ? null : JSON.parse(row.stats_json) } catch { stats = null }
      const samples = db.prepare(`
        SELECT id FROM photos WHERE project_id = ? AND thumb_path IS NOT NULL
        ORDER BY RANDOM() LIMIT 8
      `).all(id)
      result.push({
        stage, status: row.status, stats, costCny: row.cost_cny, cursor: row.cursor,
        sampleIds: samples.map(sample => sample.id),
        startedAt: row.started_at, finishedAt: row.finished_at,
      })
    }
    return result
  }

  async startStage(id, stage, { action = 'start' } = {}) {
    if (!STAGES.has(stage)) throw stageError(`unsupported stage: ${stage}`, 'BAD_STAGE', 400)
    const current = this.running.get(id)

    if (action === 'pause' || action === 'cancel') {
      if (current === undefined) return { [action]: stage, running: false }
      current.controller.abort()
      if (action === 'cancel') {
        const { db } = await this.store.open(id)
        const finishedAt = Date.now()
        db.prepare(`UPDATE stage_runs SET status = 'cancelled', finished_at = ?
                    WHERE project_id = ? AND status = 'running'`).run(finishedAt, id)
        db.prepare('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?')
          .run('failed', finishedAt, id)
      }
      this.events.emit('event', { projectId: id, stage: current.stage, [action]: true })
      return { [action]: stage }
    }

    if (current !== undefined) throw new Error(`a stage is already running for project ${id}`)
    const { db, project } = await this.store.open(id)
    if (AI_STAGES.has(stage)) {
      const capable = await this.imageCapable(project)
      if (!capable) throw stageError(`model ${project.modelId} does not accept image input`, 'MODEL_NO_IMAGE_INPUT', 400)
      if (project.offpeakOnly && isPeakHour(new Date())) {
        throw stageError('off-peak only is enabled; retry after 18:00', 'OFFPEAK_BLOCKED', 409)
      }
    }

    const controller = new AbortController()
    const onProgress = progress => this.events.emit('event', { projectId: id, ...progress })
    let task
    if (stage === 'scan') {
      task = scanProject({ db, projectId: id, source: new LocalSource(project.sourcePath), onProgress })
    } else if (stage === 'preprocess') {
      task = preprocessProject({
        db,
        projectId: id,
        sourceRoot: project.sourcePath,
        workspaceDir: project.workspaceDir,
        onProgress,
      })
    } else {
      const deps = {
        db,
        projectId: id,
        project,
        llm: this.ctx.llm,
        attachments: this.ctx.attachments,
        workspaceDir: project.workspaceDir,
        signal: controller.signal,
        onEvent: onProgress,
        thumbFor: photo => readFile(path.join(project.workspaceDir, photo.thumb_path)).catch(() => undefined),
        loadPhoto: photo => path.join(project.sourcePath, photo.rel_path),
      }
      task = stage === 'grid' ? runGridStage(deps)
        : stage === 'rank' ? runRankStage(deps)
          : runScoreStage(deps)
    }

    this.running.set(id, { stage, controller })
    task
      .then(result => this.events.emit('event', { projectId: id, stage, done: true, result }))
      .catch(error => this.events.emit('event', {
        projectId: id, stage, error: String(error?.message ?? error), code: error?.code,
      }))
      .finally(() => {
        if (this.running.get(id)?.stage === stage) this.running.delete(id)
      })
    return { started: stage }
  }

  async reviewPhotos(id, options = {}) {
    const { db } = await this.store.open(id)
    return listReviewPhotos(db, id, options)
  }

  async photoDetail(id, photoId) {
    const { db } = await this.store.open(id)
    return getPhotoDetail(db, id, photoId)
  }

  async setDecisions(id, { photoIds, verdict } = {}) {
    const { db } = await this.store.open(id)
    return setHumanDecisions(db, id, photoIds, verdict)
  }

  async stats(id) {
    const { db } = await this.store.open(id)
    return projectStats(db, id)
  }

  async groups(id, options = {}) {
    const { db } = await this.store.open(id)
    return listGroups(db, id, options)
  }

  async group(id, groupId) {
    const { db } = await this.store.open(id)
    return groupDetail(db, id, groupId)
  }

  async calibrationSample(id, options = {}) {
    const { db } = await this.store.open(id)
    return sampleCalibration(db, id, options)
  }

  async calibrate(id, labels = []) {
    const { db } = await this.store.open(id)
    const report = computeCalibration(db, id, labels)
    return saveCalibrationReport(db, id, report)
  }

  async calibrationReport(id) {
    const { db } = await this.store.open(id)
    return lastCalibrationReport(db, id)
  }

  async updateSettings(id, patch = {}) {
    const { db, project } = await this.store.open(id)
    if (patch.modelId !== undefined) {
      const capable = await this.imageCapable({ modelRoute: project.modelRoute, modelId: String(patch.modelId) })
      if (!capable) throw stageError(`model ${patch.modelId} does not accept image input`, 'BAD_SETTING', 400)
    }
    const fields = {
      theme: ['theme', value => typeof value === 'string'],
      budgetCny: ['budget_cny', value => Number.isFinite(Number(value)) && Number(value) >= 0],
      concurrency: ['concurrency', value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 16],
      gridCols: ['grid_cols', value => Number.isInteger(Number(value)) && Number(value) >= 1],
      gridRows: ['grid_rows', value => Number.isInteger(Number(value)) && Number(value) >= 1],
      thresholdKeep: ['threshold_keep', value => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 10],
      thresholdMaybe: ['threshold_maybe', value => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 10],
      stagePause: ['stage_pause', value => typeof value === 'boolean' || value === 0 || value === 1],
      offpeakOnly: ['offpeak_only', value => typeof value === 'boolean' || value === 0 || value === 1],
      groupBurstSeconds: ['group_burst_seconds', value => Number.isFinite(Number(value)) && Number(value) >= 0],
      groupBurstHamming: ['group_burst_hamming', value => Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 64],
      groupSceneSeconds: ['group_scene_seconds', value => Number.isFinite(Number(value)) && Number(value) >= 0],
      groupSceneHamming: ['group_scene_hamming', value => Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 64],
      promptVersion: ['prompt_version', value => typeof value === 'string' && /^v\d+$/.test(value)],
      modelId: ['model_id', value => typeof value === 'string' && value.length > 0],
    }
    const sets = []
    const params = []
    for (const [key, [column, valid]] of Object.entries(fields)) {
      if (patch[key] === undefined) continue
      if (!valid(patch[key])) {
        const error = new Error(`invalid setting ${key}: ${patch[key]}`)
        error.code = 'BAD_SETTING'
        error.statusCode = 400
        throw error
      }
      const value = typeof patch[key] === 'boolean' ? (patch[key] ? 1 : 0) : patch[key]
      sets.push(`${column} = ?`)
      params.push(value)
    }
    if (sets.length === 0) return this.getProjectDetail(id)
    db.prepare(`UPDATE projects SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`)
      .run(...params, Date.now(), id)
    this.events.emit('event', { projectId: id, settings: true })
    return this.getProjectDetail(id)
  }

  async previewFile(id, photoId) {
    const { db, project } = await this.store.open(id)
    const row = db.prepare('SELECT rel_path FROM photos WHERE id = ? AND project_id = ?').get(photoId, id)
    if (row === undefined) return undefined
    const sourcePath = path.join(project.sourcePath, row.rel_path)
    const cachePath = path.join(project.workspaceDir, 'previews', `${photoId}.jpg`)
    try {
      const rendered = await renderPreview(sourcePath, cachePath)
      return rendered.path
    } catch {
      return undefined
    }
  }

  async exportPreview(id, options = {}) {
    const { db, project } = await this.store.open(id)
    return previewExport({ db, project, ...options })
  }

  async exportRun(id, options = {}) {
    const { db, project } = await this.store.open(id)
    return runExport({ db, project, ...options })
  }

  async promptInfo(projectId) {
    let project
    if (projectId !== undefined) {
      const opened = await this.store.open(projectId)
      project = opened.project
    }
    const theme = project?.theme ?? 'mixed'
    const cols = project?.gridCols ?? 4
    const rows = project?.gridRows ?? 4
    return {
      version: PROMPT_VERSION,
      prompts: {
        gridSystem: GRID_SYSTEM,
        gridUser: gridUserPrompt({ count: cols * rows, cols, rows, theme }),
        rankSystem: RANK_SYSTEM,
        rankUser: rankUserPrompt({ count: 6 }),
        scoreSystem: SCORE_SYSTEM,
        scoreUser: scoreUserPrompt({ theme }),
      },
    }
  }

  async models(route = 'deepseek-official') {
    try {
      return { route, models: await this.ctx.llm.listModels(route) }
    } catch (error) {
      return { route, models: [], error: String(error?.message ?? error) }
    }
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
