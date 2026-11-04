import { nanoid } from 'nanoid'
import { readFile } from 'node:fs/promises'
import { costOfUsage, isPeakHour } from './cost.js'
import { renderGrid, packCells } from './grid.js'
import { completeText } from './llm.js'
import { renderPhotoForModel } from './model-image.js'
import {
  GRID_RETRY_USER, GRID_SYSTEM, PROMPT_VERSION, RANK_SYSTEM, SCORE_SYSTEM,
  gridUserPrompt, rankUserPrompt, scoreUserPrompt,
} from './prompts.js'
import { BadModelJson, parseGridSelection, parseRank, parseScore } from './parse.js'

const LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** 有界并发映射；某个任务的异常会原样抛出。 */
export async function mapLimit(items, limit, fn) {
  if (items.length === 0) return []
  const results = new Array(items.length)
  let next = 0
  const size = Math.max(1, Math.min(limit, items.length))
  const workers = Array.from({ length: size }, async () => {
    while (true) {
      const index = next
      next += 1
      if (index >= items.length) return
      results[index] = await fn(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}

function startStageRun(db, projectId, stage) {
  const id = nanoid()
  db.prepare(`INSERT INTO stage_runs (id, project_id, stage, status, started_at)
              VALUES (?, ?, ?, 'running', ?)`).run(id, projectId, stage, Date.now())
  return id
}

function finishStageRun(db, projectId, stageRunId, { status, stats, costCny, cursor, projectStatus }) {
  const finishedAt = Date.now()
  db.prepare(`UPDATE stage_runs SET status = ?, cursor = ?, stats_json = ?, cost_cny = ?, finished_at = ?
              WHERE id = ?`).run(status, cursor ?? null, JSON.stringify(stats), costCny, finishedAt, stageRunId)
  db.prepare('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?')
    .run(projectStatus, finishedAt, projectId)
}

function recordError(db, projectId, stage, code, message, photoId = null) {
  db.prepare(`INSERT INTO errors (id, project_id, stage, photo_id, code, message, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(nanoid(), projectId, stage, photoId, code, message, Date.now())
}

/** 只写 AI 决策；已有人类决策时保持人类判定（spec 7.7）。 */
function upsertAiDecision(db, projectId, photoId, verdict) {
  db.prepare(`
    INSERT INTO decisions (photo_id, project_id, verdict, source, updated_at)
    VALUES (?, ?, ?, 'ai', ?)
    ON CONFLICT(photo_id) DO UPDATE SET
      verdict = excluded.verdict,
      source = 'ai',
      updated_at = excluded.updated_at
    WHERE decisions.source = 'ai'
  `).run(photoId, projectId, verdict, Date.now())
}

function hasAssessment(db, targetKind, targetId, stage, modelId) {
  return db.prepare(`SELECT id FROM assessments
    WHERE target_kind = ? AND target_id = ? AND stage = ? AND model_id = ? AND prompt_version = ?`)
    .get(targetKind, targetId, stage, modelId ?? null, PROMPT_VERSION) !== undefined
}

function insertAssessment(db, projectId, { targetKind, targetId, stage, modelId, modelRoute, score, verdict, dimensions, postProcessing, reason, raw, tokensIn, tokensOut, costCny }) {
  if (hasAssessment(db, targetKind, targetId, stage, modelId)) return false
  db.prepare(`
    INSERT INTO assessments (id, project_id, target_kind, target_id, stage, model_route, model_id,
      prompt_version, score, verdict, dimensions_json, post_processing_json, reason, raw_json,
      tokens_in, tokens_out, cost_cny, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    nanoid(), projectId, targetKind, targetId, stage, modelRoute ?? null, modelId ?? null, PROMPT_VERSION,
    score ?? null, verdict ?? null,
    dimensions === undefined ? null : JSON.stringify(dimensions),
    postProcessing === undefined ? null : JSON.stringify(postProcessing),
    reason ?? null, raw === undefined ? null : JSON.stringify(raw),
    tokensIn ?? 0, tokensOut ?? 0, costCny ?? 0, Date.now(),
  )
  return true
}

function usageCost(usage, peak) {
  return costOfUsage(usage, { peak })
}

/**
 * L2 网格粗筛：候选 → 分组感知打包 → 网格图 → 每格一次模型调用。
 * @returns {Promise<{ paused: boolean, spentCny: number, selected: number, rejected: number, failed: number, grids: number, errors: number }>}
 */
export async function runGridStage({
  db, projectId, project, workspaceDir, llm, attachments,
  thumbFor, onEvent = () => {}, signal, now = () => new Date(),
  budgetCny = project.budgetCny,
}) {
  const stageRunId = startStageRun(db, projectId, 'grid')
  const startedAt = Date.now()
  const peak = isPeakHour(now())
  const cols = project.gridCols ?? 4
  const rows = project.gridRows ?? 4
  const concurrency = Math.max(1, project.concurrency ?? 8)

  const candidates = db.prepare(`
    SELECT id, rel_path, group_id, taken_at, mtime_ms, thumb_path FROM photos
    WHERE project_id = ? AND state = 'ok' AND thumb_path IS NOT NULL
    ORDER BY COALESCE(taken_at, mtime_ms), rel_path
  `).all(projectId)
  const packed = packCells(candidates, { cols, rows })

  let spentCny = 0
  let selected = 0
  let rejected = 0
  let failed = 0
  let done = 0
  let errors = 0
  let paused = false
  let cursor = null

  const overBudget = () => budgetCny !== undefined && budgetCny > 0 && spentCny >= budgetCny

  await mapLimit(packed, concurrency, async grid => {
    if (signal?.aborted === true || paused) return
    cursor = grid.seq
    const rendered = await renderGrid({
      photos: grid.photos,
      thumbFor,
      workspaceDir,
      cols,
      rows,
    })
    const data = await readFile(rendered.path)
    const image = await attachments.saveImage({ data, mediaType: 'image/jpeg' })
    const validCodes = Object.keys(rendered.cellMap)
    const prompt = gridUserPrompt({ count: grid.photos.length, cols, rows, theme: project.theme })
    const gridId = nanoid()
    const createdAt = Date.now()

    let usage = { inputTokens: 0, outputTokens: 0 }
    let cost = 0
    let parsed = { codes: [], parsed: false }
    let lastError = null
    try {
      const first = await completeText({
        llm, provider: project.modelRoute, model: project.modelId,
        system: GRID_SYSTEM, prompt, image, maxTokens: 256, temperature: 0, signal,
      })
      usage = sumUsage(usage, first.usage)
      cost += usageCost(first.usage, peak)
      parsed = parseGridSelection(first.text, validCodes)
      if (!parsed.parsed) {
        const retry = await completeText({
          llm, provider: project.modelRoute, model: project.modelId,
          system: GRID_SYSTEM, prompt: `${prompt}\n\n${GRID_RETRY_USER}`, image,
          maxTokens: 256, temperature: 0, signal,
        })
        usage = sumUsage(usage, retry.usage)
        cost += usageCost(retry.usage, peak)
        parsed = parseGridSelection(retry.text, validCodes)
      }
    } catch (error) {
      if (signal?.aborted === true) return
      lastError = error
    }

    spentCny += cost
    done += 1

    const selectedIds = new Set(parsed.codes.map(code => rendered.cellMap[code]))
    const status = lastError === null && parsed.parsed ? 'selected' : 'parse_failed'
    db.prepare(`
      INSERT INTO grids (id, project_id, seq, cols, rows, image_path, cell_map_json, status,
        selected_cells_json, tokens_in, tokens_out, cost_cny, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      gridId, projectId, grid.seq, cols, rows, relativeTo(workspaceDir, rendered.path),
      JSON.stringify(rendered.cellMap), status,
      parsed.parsed ? JSON.stringify(parsed.codes) : null,
      usage.inputTokens, usage.outputTokens, cost, createdAt,
    )

    if (status === 'parse_failed') {
      failed += grid.photos.length
      const message = lastError === null ? 'grid response was not parseable' : String(lastError.message ?? lastError)
      recordError(db, projectId, 'grid', lastError?.code ?? 'GRID_PARSE_FAILED', `${grid.seq}: ${message}`)
      for (const photo of grid.photos) {
        db.prepare("UPDATE photos SET state = 'grid_error' WHERE id = ?").run(photo.id)
      }
      errors += 1
    } else {
      for (const photo of grid.photos) {
        if (selectedIds.has(photo.id)) {
          selected += 1
          db.prepare("UPDATE photos SET state = 'grid_selected' WHERE id = ?").run(photo.id)
        } else {
          rejected += 1
          db.prepare("UPDATE photos SET state = 'grid_rejected' WHERE id = ?").run(photo.id)
          upsertAiDecision(db, projectId, photo.id, 'reject')
        }
      }
    }

    onEvent({
      stage: 'grid', done, total: packed.length, selected, rejected,
      costCny: round6(spentCny), seq: grid.seq,
    })
    if (overBudget()) paused = true
  })

  const stats = {
    done, total: packed.length, selected, rejected, failed, errors,
    durationMs: Date.now() - startedAt,
  }
  finishStageRun(db, projectId, stageRunId, {
    status: paused ? 'paused' : 'done',
    stats,
    costCny: round6(spentCny),
    cursor,
    projectStatus: paused ? 'paused' : 'gridded',
  })
  return { paused, spentCny: round6(spentCny), selected, rejected, failed, grids: packed.length, errors }
}

/**
 * L3a 组内排序：只处理入选数 ≥3 的组；每批最多 6 张。
 * @returns {Promise<{ paused: boolean, spentCny: number, groups: number, kept: number }>}
 */
export async function runRankStage({
  db, projectId, project, llm, onEvent = () => {}, signal,
  now = () => new Date(), budgetCny = project.budgetCny,
}) {
  const stageRunId = startStageRun(db, projectId, 'rank')
  const startedAt = Date.now()
  const peak = isPeakHour(now())
  const concurrency = Math.max(1, project.concurrency ?? 8)

  const groups = db.prepare(`
    SELECT g.id AS group_id, COUNT(p.id) AS selected
    FROM groups g
    JOIN photos p ON p.group_id = g.id AND p.state = 'grid_selected'
    WHERE g.project_id = ?
    GROUP BY g.id
    HAVING COUNT(p.id) >= 3
    ORDER BY g.started_at
  `).all(projectId)

  let spentCny = 0
  let kept = 0
  let done = 0
  let paused = false

  await mapLimit(groups, concurrency, async group => {
    if (signal?.aborted === true || paused) return
    const members = db.prepare(`
      SELECT id, rel_path, taken_at, mtime_ms FROM photos
      WHERE project_id = ? AND group_id = ? AND state = 'grid_selected'
      ORDER BY COALESCE(taken_at, mtime_ms), rel_path
    `).all(projectId, group.group_id)
    if (members.length < 3) return

    let usage = { inputTokens: 0, outputTokens: 0 }
    let cost = 0
    try {
      const chunks = chunk(members, 6)
      const chunkWinners = []
      let firstOrder = null
      for (const items of chunks) {
        const ranked = await rankOnce({ llm, project, items, signal })
        usage = sumUsage(usage, ranked.usage)
        cost += ranked.cost
        chunkWinners.push(ranked.members[0])
        firstOrder ??= ranked.members
      }
      let winner = chunkWinners[0]
      let order = chunkWinners
      if (chunkWinners.length > 1) {
        const final = await rankOnce({ llm, project, items: chunkWinners, signal })
        usage = sumUsage(usage, final.usage)
        cost += final.cost
        winner = final.members[0]
        order = [...final.members, ...firstOrder.filter(member => !final.members.includes(member))]
      }
      const keepCount = group.selected > 12 ? 2 : 1
      const keepers = new Set(order.slice(0, keepCount).map(member => member.id))
      if (!keepers.has(winner.id)) keepers.add(winner.id)

      for (const member of members) {
        if (keepers.has(member.id)) continue
        upsertAiDecision(db, projectId, member.id, 'reject')
      }
      kept += members.length - keepers.size
      spentCny += cost
      insertAssessment(db, projectId, {
        targetKind: 'group', targetId: group.group_id, stage: 'rank',
        modelId: project.modelId, modelRoute: project.modelRoute,
        raw: { order: order.map(member => member.id), keep: [...keepers] },
        tokensIn: usage.inputTokens, tokensOut: usage.outputTokens, costCny: cost,
      })
    } catch (error) {
      if (signal?.aborted === true) return
      recordError(db, projectId, 'rank', error?.code ?? 'RANK_FAILED', String(error?.message ?? error))
    }
    done += 1
    onEvent({ stage: 'rank', done, total: groups.length, kept, costCny: round6(spentCny) })
    if (budgetCny !== undefined && budgetCny > 0 && spentCny >= budgetCny) paused = true
  })

  const stats = { done, total: groups.length, kept, durationMs: Date.now() - startedAt }
  finishStageRun(db, projectId, stageRunId, {
    status: paused ? 'paused' : 'done',
    stats,
    costCny: round6(spentCny),
    projectStatus: paused ? 'paused' : 'scored',
  })
  return { paused, spentCny: round6(spentCny), groups: groups.length, kept }
}

async function rankOnce({ llm, project, items, signal }) {
  const labels = items.map((_, index) => LABELS[index])
  const prompt = rankUserPrompt({ count: items.length })
  const response = await completeText({
    llm, provider: project.modelRoute, model: project.modelId,
    system: RANK_SYSTEM, prompt, maxTokens: 200, temperature: 0, signal,
  })
  const parsed = parseRank(response.text, labels)
  const byLabel = new Map(items.map((item, index) => [LABELS[index], item]))
  return {
    members: parsed.order.map(label => byLabel.get(label)).filter(Boolean),
    parsed,
    usage: response.usage,
    cost: costOfUsage(response.usage, { peak: isPeakHour(new Date()) }),
  }
}

/**
 * L3b 单张精评：对排名胜者、小组入选、未分组入选与 grid_error 逐张打分。
 * @returns {Promise<{ paused: boolean, spentCny: number, scored: number, failed: number }>}
 */
export async function runScoreStage({
  db, projectId, project, llm, attachments, loadPhoto,
  onEvent = () => {}, signal, now = () => new Date(), budgetCny = project.budgetCny,
}) {
  const stageRunId = startStageRun(db, projectId, 'score')
  const startedAt = Date.now()
  const peak = isPeakHour(now())
  const concurrency = Math.max(1, project.concurrency ?? 8)

  const targets = db.prepare(`
    SELECT p.id, p.rel_path, p.state FROM photos p
    WHERE p.project_id = ?
      AND p.thumb_path IS NOT NULL
      AND (p.state = 'grid_selected' OR p.state = 'grid_error')
      AND NOT EXISTS (
        SELECT 1 FROM decisions d
        WHERE d.photo_id = p.id AND d.source = 'ai' AND d.verdict = 'reject'
      )
      AND NOT EXISTS (
        SELECT 1 FROM assessments a
        WHERE a.target_kind = 'photo' AND a.target_id = p.id
          AND a.stage = 'single' AND a.model_id = ? AND a.prompt_version = ?
      )
    ORDER BY COALESCE(p.taken_at, p.mtime_ms), p.rel_path
  `).all(projectId, project.modelId, PROMPT_VERSION)

  let spentCny = 0
  let scored = 0
  let failed = 0
  let done = 0
  let paused = false

  await mapLimit(targets, concurrency, async photo => {
    if (signal?.aborted === true || paused) return
    let usage = { inputTokens: 0, outputTokens: 0 }
    let cost = 0
    let result = null
    let lastError = null
    try {
      const bytes = await loadPhoto(photo)
      const rendered = await renderPhotoForModel(bytes)
      const image = await attachments.saveImage({ data: rendered.data, mediaType: rendered.mediaType })
      const prompt = scoreUserPrompt({ theme: project.theme })
      const first = await completeText({
        llm, provider: project.modelRoute, model: project.modelId,
        system: SCORE_SYSTEM, prompt, image, maxTokens: 300, temperature: 0, signal,
      })
      usage = sumUsage(usage, first.usage)
      cost += usageCost(first.usage, peak)
      try {
        result = parseScore(first.text)
      } catch (error) {
        if (!(error instanceof BadModelJson)) throw error
        const retry = await completeText({
          llm, provider: project.modelRoute, model: project.modelId,
          system: SCORE_SYSTEM, prompt: `${prompt}\n\n上一次返回不是合法 JSON，请只返回合法 JSON。`,
          image, maxTokens: 300, temperature: 0, signal,
        })
        usage = sumUsage(usage, retry.usage)
        cost += usageCost(retry.usage, peak)
        result = parseScore(retry.text)
      }
    } catch (error) {
      if (signal?.aborted === true) return
      lastError = error
    }

    spentCny += cost
    done += 1

    if (result === null) {
      failed += 1
      recordError(db, projectId, 'score', lastError?.code ?? 'SCORE_FAILED', String(lastError?.message ?? lastError), photo.id)
      upsertAiDecision(db, projectId, photo.id, 'maybe')
      db.prepare("UPDATE photos SET state = 'scored' WHERE id = ?").run(photo.id)
    } else {
      scored += 1
      const verdict = result.score >= (project.thresholdKeep ?? 7.5)
        ? 'keep'
        : result.score >= (project.thresholdMaybe ?? 6)
          ? 'maybe'
          : 'reject'
      insertAssessment(db, projectId, {
        targetKind: 'photo', targetId: photo.id, stage: 'single',
        modelId: project.modelId, modelRoute: project.modelRoute,
        score: result.score, verdict, dimensions: result.dimensions,
        postProcessing: result.postProcessing, reason: result.reason,
        raw: result, tokensIn: usage.inputTokens, tokensOut: usage.outputTokens, costCny: cost,
      })
      upsertAiDecision(db, projectId, photo.id, verdict)
      db.prepare("UPDATE photos SET state = 'scored' WHERE id = ?").run(photo.id)
    }

    onEvent({
      stage: 'score', done, total: targets.length, scored,
      costCny: round6(spentCny),
    })
    if (budgetCny !== undefined && budgetCny > 0 && spentCny >= budgetCny) paused = true
  })

  const stats = { done, total: targets.length, scored, failed, durationMs: Date.now() - startedAt }
  finishStageRun(db, projectId, stageRunId, {
    status: paused ? 'paused' : 'done',
    stats,
    costCny: round6(spentCny),
    projectStatus: paused ? 'paused' : 'scored',
  })
  return { paused, spentCny: round6(spentCny), scored, failed }
}

function chunk(items, size) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size))
  return chunks
}

function sumUsage(left, right) {
  return {
    inputTokens: (left.inputTokens ?? 0) + (right.inputTokens ?? 0),
    outputTokens: (left.outputTokens ?? 0) + (right.outputTokens ?? 0),
    cacheReadTokens: (left.cacheReadTokens ?? 0) + (right.cacheReadTokens ?? 0),
    cacheWriteTokens: (left.cacheWriteTokens ?? 0) + (right.cacheWriteTokens ?? 0),
  }
}

function round6(value) {
  return Math.round(value * 1e6) / 1e6
}

function relativeTo(base, file) {
  return file.startsWith(`${base}/`) ? file.slice(base.length + 1) : file
}
