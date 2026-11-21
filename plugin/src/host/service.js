import { Service } from '@deepseek-ai/cordis'
import { EventEmitter } from 'node:events'
import { readFile, readdir, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createHttpHandler } from './http.js'
import { dshHome } from './paths.js'
import { isPeakHour } from './cost.js'
import { renderEditedBuffer, renderEditedFile } from './edit.js'
import { previewExport, runExport } from './export.js'
import { listGlobalPhotos } from './global-wall.js'
import { previewGlobalExport, runGlobalExport } from './global-export.js'
import { renderPreview } from './images.js'
import { fromPortablePath, platform } from './platform.js'
import { connectSmb as connectSmbHost, defaultListVolumes } from './network.js'
import { runPipeline } from './orchestrator.js'
import { runGridStage, runRankStage, runScoreStage } from './pipeline.js'
import { ProjectStore, toProject } from './projects.js'
import {
  computeCalibration, lastCalibrationReport, sampleCalibration, saveCalibrationReport,
} from './calibration.js'
import {
  getPhotoDetail, groupDetail, listGroups, listReviewPhotos, projectStats, setHumanDecisions, setSceneOverride, setRecipeOverride,
} from './review.js'
import { preprocessProject } from './preprocess.js'
import {
  GRID_SYSTEM, PROMPT_VERSION, RANK_SYSTEM, SCORE_SYSTEM,
  gridUserPrompt, rankUserPrompt, scoreUserPrompt,
} from './prompts.js'
import { normalizeRecipe, recipeSignature } from './recipe.js'
import { scanProject } from './scan.js'
import { sourceFor } from './source.js'
import { createPhotoPickerExportTool, createPhotoPickerTool } from './tools.js'

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

  async deleteProject(id) {
    if (this.running.has(id)) {
      throw stageError('project is running; pause/cancel it before deleting', 'PROJECT_RUNNING', 409)
    }
    return this.store.remove(id)
  }

  async createProject(input) {
    let source = input.source
    if (source?.kind === 'smb' && source.mountPoint === undefined) {
      const connected = await this.connectSmb(source.url ?? source.path)
      source = {
        ...source,
        path: connected.sourcePath,
        mountPoint: connected.mountPoint,
        url: connected.url,
      }
    }
    const project = await this.store.create({ ...input, source })
    return this.getProjectDetail(project.id)
  }

  /** 打开系统 SMB 登录框并等待挂载；密码只进系统钥匙串。 */
  async connectSmb(rawUrl) {
    if (!platform.isMac) {
      throw stageError('SMB auto-connect is currently macOS-only; use a mapped drive or UNC path as a local source', 'UNSUPPORTED_PLATFORM', 400)
    }
    return connectSmbHost({ rawUrl, platform })
  }

  async listNetworkVolumes() {
    const names = await defaultListVolumes()
    return names.map(name => ({ name, path: path.join('/Volumes', name), network: true }))
  }

  /** 每次启动阶段前重读项目行，避免用到打开时的旧设置。 */
  async freshProject(id) {
    const { db } = await this.store.open(id)
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
    if (row === undefined) throw new Error(`unknown project: ${id}`)
    return toProject(row)
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
    let sourceOnline = true
    if (project.sourceKind !== 'local') {
      try {
        sourceOnline = await sourceFor(project).health()
      } catch {
        sourceOnline = false
      }
    }
    return {
      ...project,
      sourceOnline,
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
    return fromPortablePath(project.workspaceDir, row.thumb_path)
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
    const { db } = await this.store.open(id)
    const project = await this.freshProject(id)
    if (AI_STAGES.has(stage)) {
      const capable = await this.imageCapable(project)
      if (!capable) throw stageError(`model ${project.modelId} does not accept image input`, 'MODEL_NO_IMAGE_INPUT', 400)
      if (project.offpeakOnly && isPeakHour(new Date())) {
        throw stageError('off-peak only is enabled; retry after 18:00', 'OFFPEAK_BLOCKED', 409)
      }
    }

    const controller = new AbortController()
    const task = this.stageTask(stage, { db, project, controller })
    this.running.set(id, { stage, controller })
    task
      .then(result => this.events.emit('event', { projectId: id, stage, done: true, result }))
      .catch(async error => {
        await this.markStageFailed(db, id, stage, error).catch(() => {})
        this.events.emit('event', {
          projectId: id, stage, error: String(error?.message ?? error), code: error?.code,
        })
      })
      .finally(() => {
        if (this.running.get(id)?.stage === stage) this.running.delete(id)
      })
    return { started: stage }
  }

  /** 把异常阶段从 running 收尾为 failed，避免 AI 记录永久停在运行中。 */
  async markStageFailed(db, projectId, stage, error) {
    const now = Date.now()
    const code = String(error?.code ?? 'STAGE_FAILED')
    const result = db.prepare(`UPDATE stage_runs SET status = 'failed', error_code = ?, finished_at = ?
                WHERE project_id = ? AND (? IS NULL OR stage = ?) AND status = 'running'`)
      .run(code, now, projectId, stage ?? null, stage ?? null)
    if (result.changes > 0) {
      db.prepare('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?').run('failed', now, projectId)
    }
  }

  /** 构造单个阶段的实际任务；startStage 与自动串联共用。 */
  stageTask(stage, { db, project, controller }) {
    const id = project.id
    const onProgress = progress => this.events.emit('event', { projectId: id, ...progress })
    const build = () => {
      if (stage === 'scan') {
        return scanProject({ db, projectId: id, source: sourceFor(project), onProgress })
      }
      if (stage === 'preprocess') {
        return preprocessProject({
          db,
          projectId: id,
          sourceRoot: project.sourcePath,
          workspaceDir: project.workspaceDir,
          onProgress,
        })
      }
      const source = sourceFor(project)
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
        loadPhoto: photo => source.absolute(photo.rel_path),
      }
      return stage === 'grid' ? runGridStage(deps)
        : stage === 'rank' ? runRankStage(deps)
          : runScoreStage(deps)
    }
    if (project.sourceKind === 'local') return build()
    return this.runNetworkStage(project, controller, build)
  }

  async runNetworkStage(project, controller, build) {
    const source = sourceFor(project)
    if (!(await source.health())) {
      throw stageError('network source is not available; reconnect the share first', 'NETWORK_LOST', 409)
    }
    let misses = 0
    let lost = false
    const timer = setInterval(async () => {
      if (await source.health()) {
        misses = 0
        return
      }
      misses += 1
      if (misses >= 5 && !lost) {
        lost = true
        controller.abort()
        this.events.emit('event', { projectId: project.id, network: 'lost' })
      }
    }, 15_000)
    timer.unref?.()
    try {
      const result = await build()
      if (lost) await this.markNetworkPaused(project.id)
      return result
    } catch (error) {
      if (lost || ['ENOENT', 'EIO', 'ETIMEDOUT', 'ECONNRESET', 'EHOSTDOWN', 'ENETDOWN'].includes(error?.code)) {
        await this.markNetworkPaused(project.id)
      }
      throw error
    } finally {
      clearInterval(timer)
    }
  }

  async markNetworkPaused(projectId) {
    try {
      const { db } = await this.store.open(projectId)
      const now = Date.now()
      db.prepare("UPDATE stage_runs SET status = 'paused', finished_at = ? WHERE project_id = ? AND status = 'running'").run(now, projectId)
      db.prepare('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?').run('paused', now, projectId)
      db.prepare(`INSERT INTO errors (id, project_id, stage, photo_id, code, message, created_at)
        VALUES (?, ?, NULL, NULL, 'NETWORK_LOST', 'network source was lost; reconnect and resume', ?)`)
        .run(`err-${now}-${Math.random().toString(36).slice(2, 8)}`, projectId, now)
    } catch {
      // 状态更新失败不应掩盖原始网络错误
    }
  }

  /** 自动串联阶段；stage_pause=1 时每阶段结束停下，预算暂停也会停下。 */
  async startPipeline(id, { stages = ['scan', 'preprocess', 'grid', 'rank', 'score'] } = {}) {
    if (!Array.isArray(stages) || stages.length === 0) throw stageError('pipeline needs stages', 'BAD_STAGE', 400)
    for (const stage of stages) {
      if (!STAGES.has(stage)) throw stageError(`unsupported stage: ${stage}`, 'BAD_STAGE', 400)
    }
    if (this.running.has(id)) throw new Error(`a stage is already running for project ${id}`)
    const { db } = await this.store.open(id)
    const project = await this.freshProject(id)
    if (stages.some(stage => AI_STAGES.has(stage))) {
      const capable = await this.imageCapable(project)
      if (!capable) throw stageError(`model ${project.modelId} does not accept image input`, 'MODEL_NO_IMAGE_INPUT', 400)
      if (project.offpeakOnly && isPeakHour(new Date())) {
        throw stageError('off-peak only is enabled; retry after 18:00', 'OFFPEAK_BLOCKED', 409)
      }
    }
    const controller = new AbortController()
    this.running.set(id, { stage: 'pipeline', controller })
    let lastStage = null
    const task = runPipeline({
      stages,
      signal: controller.signal,
      pauseBetween: project.stagePause === true,
      onStage: event => {
        if (event.phase === 'start') lastStage = event.stage
        this.events.emit('event', {
          projectId: id,
          pipeline: true,
          stage: event.stage,
          phase: event.phase,
          ...(event.phase === 'done' ? { done: true, result: event.result } : {}),
        })
      },
      runStage: stage => this.stageTask(stage, { db, project, controller }),
    })
    task
      .then(result => this.events.emit('event', {
        projectId: id, pipeline: true, stage: 'pipeline', done: true, result,
      }))
      .catch(async error => {
        await this.markStageFailed(db, id, lastStage, error).catch(() => {})
        this.events.emit('event', {
          projectId: id, pipeline: true, stage: 'pipeline', error: String(error?.message ?? error), code: error?.code,
        })
      })
      .finally(() => {
        if (this.running.get(id)?.stage === 'pipeline') this.running.delete(id)
      })
    return { started: 'pipeline', stages }
  }

  /** 在 Finder 中显示（macOS）：目录直接打开，文件则 -R 定位。 */
  async reveal(target) {
    if (typeof target !== 'string' || !path.isAbsolute(target)) {
      throw stageError('target must be an absolute path', 'BAD_PATH', 400)
    }
    let info
    try {
      info = await stat(target)
    } catch {
      throw stageError(`path not found: ${target}`, 'NOT_FOUND', 404)
    }
    await platform.revealPath(target, info.isDirectory())
    return { revealed: target }
  }

  async reviewPhotos(id, options = {}) {
    const { db } = await this.store.open(id)
    return listReviewPhotos(db, id, options)
  }

  async aiRuns(id, { limit = 20, offset = 0 } = {}) {
    const { db } = await this.store.open(id)
    const limitValue = Number(limit)
    const offsetValue = Number(offset)
    const pageLimit = Math.min(Math.max(Number.isFinite(limitValue) ? limitValue : 20, 1), 100)
    const pageOffset = Math.max(Number.isFinite(offsetValue) ? offsetValue : 0, 0)
    const total = db.prepare(`
      SELECT COUNT(*) AS n FROM stage_runs
      WHERE project_id = ? AND stage IN ('grid', 'rank', 'score')
    `).get(id).n
    const rows = db.prepare(`
      SELECT id, stage, status, model_route, model_id, prompt_version,
             tokens_in, tokens_out, call_count, cost_cny, error_code,
             started_at, finished_at, stats_json
      FROM stage_runs
      WHERE project_id = ? AND stage IN ('grid', 'rank', 'score')
      ORDER BY started_at DESC, id DESC
      LIMIT ? OFFSET ?
    `).all(id, pageLimit, pageOffset)
    return {
      total,
      items: rows.map(row => {
        let stats = null
        try { stats = row.stats_json === null ? null : JSON.parse(row.stats_json) } catch { stats = null }
        return {
          id: row.id,
          stage: row.stage,
          status: row.status,
          modelRoute: row.model_route ?? null,
          modelId: row.model_id ?? null,
          promptVersion: row.prompt_version ?? null,
          tokensIn: row.tokens_in ?? 0,
          tokensOut: row.tokens_out ?? 0,
          callCount: row.call_count ?? 0,
          costCny: row.cost_cny ?? 0,
          errorCode: row.error_code ?? null,
          startedAt: row.started_at,
          finishedAt: row.finished_at,
          durationMs: row.started_at !== null && row.finished_at !== null
            ? Math.max(0, row.finished_at - row.started_at)
            : null,
          stats,
        }
      }),
    }
  }

  async globalPhotos(filters = {}) {
    return listGlobalPhotos({ store: this.store, filters })
  }

  async globalExportPreview(options = {}) {
    return previewGlobalExport({ store: this.store, ...options })
  }

  async globalExportRun(options = {}) {
    return runGlobalExport({ store: this.store, ...options })
  }

  async photoDetail(id, photoId) {
    const { db } = await this.store.open(id)
    return getPhotoDetail(db, id, photoId)
  }

  async setPhotoScenes(id, photoId, { scenes, primaryScene } = {}) {
    const { db } = await this.store.open(id)
    return setSceneOverride(db, id, photoId, scenes, primaryScene)
  }

  async setPhotoRecipe(id, photoId, body = {}) {
    if (!Object.prototype.hasOwnProperty.call(body, 'recipe')) {
      throw stageError('recipe is required (pass null to restore AI)', 'BAD_RECIPE', 400)
    }
    const { db } = await this.store.open(id)
    setRecipeOverride(db, id, photoId, body.recipe)
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
    const nextRoute = patch.modelRoute === undefined ? project.modelRoute : String(patch.modelRoute)
    const nextModel = patch.modelId === undefined ? project.modelId : String(patch.modelId)
    if (patch.modelRoute !== undefined || patch.modelId !== undefined) {
      let models
      try {
        models = await this.ctx.llm.listModels(nextRoute)
      } catch (cause) {
        throw stageError(`model route is unavailable: ${nextRoute}: ${String(cause?.message ?? cause)}`, 'BAD_SETTING', 400)
      }
      const model = models.find(entry => entry.id === nextModel)
      if (model === undefined) throw stageError(`model ${nextModel} is not available on route ${nextRoute}`, 'BAD_SETTING', 400)
      if (Array.isArray(model.inputModalities) && !model.inputModalities.includes('image')) {
        throw stageError(`model ${nextModel} does not accept image input`, 'BAD_SETTING', 400)
      }
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
      modelRoute: ['model_route', value => typeof value === 'string' && value.length > 0],
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
    const sourcePath = fromPortablePath(project.sourcePath, row.rel_path)
    const cachePath = path.join(project.workspaceDir, 'previews', `${photoId}.jpg`)
    try {
      const rendered = await renderPreview(sourcePath, cachePath)
      return rendered.path
    } catch {
      return undefined
    }
  }

  /** 草稿配方渲染为临时 JPEG（不写数据库、不落缓存），供拖动滑杆时预览。 */
  async renderRecipePreview(id, photoId, recipeInput) {
    const { db, project } = await this.store.open(id)
    const row = db.prepare('SELECT rel_path FROM photos WHERE id = ? AND project_id = ?').get(photoId, id)
    if (row === undefined) {
      throw stageError(`unknown photo: ${photoId}`, 'NOT_FOUND', 404)
    }
    const recipe = normalizeRecipe(recipeInput, { allowMicroCrop: true })
    if (recipe === null) throw stageError('draft recipe is empty', 'BAD_RECIPE', 400)
    const sourcePath = fromPortablePath(project.sourcePath, row.rel_path)
    return renderEditedBuffer({ sourcePath, recipe, maxWidth: 1200 })
  }

  /** 最新 single assessment 的配方渲染成 JPEG 缓存；无配方或坏配方返回 undefined。 */
  async editedFile(id, photoId) {
    const { db, project } = await this.store.open(id)
    const row = db.prepare(`
      SELECT p.rel_path, COALESCE(ro.recipe_json, a.recipe_json) AS recipe_json,
             CASE WHEN ro.photo_id IS NOT NULL THEN 'human'
                  WHEN a.recipe_json IS NOT NULL THEN 'ai' ELSE NULL END AS edit_source
      FROM photos p
      LEFT JOIN assessments a ON a.target_id = p.id
        AND a.target_kind = 'photo' AND a.stage = 'single'
      LEFT JOIN photo_recipe_overrides ro ON ro.photo_id = p.id
      WHERE p.id = ? AND p.project_id = ?
      ORDER BY a.created_at DESC LIMIT 1
    `).get(photoId, id)
    if (row === undefined || row.recipe_json === null) return undefined
    let raw
    try { raw = JSON.parse(row.recipe_json) } catch { return undefined }
    const recipe = normalizeRecipe(raw, { allowMicroCrop: row.edit_source === 'human' })
    if (recipe === null) return undefined
    const sourcePath = fromPortablePath(project.sourcePath, row.rel_path)
    const cachePath = path.join(
      project.workspaceDir, 'edits',
      `${photoId}-${recipeSignature(recipe)}.jpg`,
    )
    try {
      const rendered = await renderEditedFile({ sourcePath, recipe, cachePath })
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
    const cols = project?.gridCols ?? 4
    const rows = project?.gridRows ?? 4
    return {
      version: PROMPT_VERSION,
      prompts: {
        gridSystem: GRID_SYSTEM,
        gridUser: gridUserPrompt({ count: cols * rows, cols, rows }),
        rankSystem: RANK_SYSTEM,
        rankUser: rankUserPrompt({ count: 6 }),
        scoreSystem: SCORE_SYSTEM,
        scoreUser: scoreUserPrompt(),
      },
    }
  }

  async modelRoutes() {
    const routes = []
    for (const provider of this.ctx.llm.listProviders()) {
      try {
        const models = await this.ctx.llm.listModels(provider.id)
        const imageModels = models.filter(model => !Array.isArray(model.inputModalities) || model.inputModalities.includes('image'))
        if (imageModels.length > 0) {
          routes.push({ id: provider.id, name: provider.name ?? provider.id, models: imageModels })
        }
      } catch {
        // Route may be unavailable temporarily; keep it out of the selector.
      }
    }
    return routes
  }

  async models(route = 'deepseek-official') {
    try {
      return { route, models: await this.ctx.llm.listModels(route) }
    } catch (error) {
      return { route, models: [], error: String(error?.message ?? error) }
    }
  }

  async chooseFolder() {
    return platform.chooseFolder()
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
