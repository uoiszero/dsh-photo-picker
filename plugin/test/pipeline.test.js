import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { openDb } from '../src/host/db.js'
import { runGridStage, runRankStage, runScoreStage } from '../src/host/pipeline.js'

const OFF_PEAK = () => new Date(2026, 10, 4, 20, 0)

function setup(projectOverrides = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'pp-pipe-'))
  const db = openDb(path.join(dir, 'db'))
  const now = Date.now()
  db.prepare(`INSERT INTO projects (id, name, workspace_dir, source_kind, source_path,
      theme, concurrency, budget_cny, model_route, model_id, created_at, updated_at)
    VALUES ('p1', 'test', ?, 'local', '/photos', 'mixed', 1, ?, 'deepseek-official', 'deepseek-flash', ?, ?)`)
    .run(dir, projectOverrides.budgetCny ?? 30, now, now)
  return { db, dir }
}

function addPhotos(db, count, { state = 'ok', groupId = null, startValue = 0 } = {}) {
  const insert = db.prepare(`INSERT INTO photos (id, project_id, rel_path, size_bytes, mtime_ms,
      format, taken_at, group_id, thumb_path, state, created_at)
    VALUES (?, 'p1', ?, 10, ?, 'jpeg', ?, ?, ?, ?, ?)`)
  for (let i = 0; i < count; i++) {
    const index = startValue + i
    insert.run(
      `p${index}`, `photo-${String(index).padStart(3, '0')}.jpg`, 1000 + index, 1000 + index,
      groupId, state === 'ok' ? `thumbs/p${index}.webp` : `thumbs/p${index}.webp`,
      state, Date.now(),
    )
  }
}

function addGroup(db, id, size) {
  db.prepare(`INSERT INTO groups (id, project_id, kind, size, started_at, ended_at)
              VALUES (?, 'p1', 'burst', ?, 1000, 2000)`).run(id, size)
}

async function solidThumb() {
  return sharp({ create: { width: 384, height: 256, channels: 3, background: '#778899' } }).jpeg().toBuffer()
}

function fakeLlm(script) {
  const calls = []
  return {
    calls,
    async *stream(options) {
      calls.push(options)
      const step = typeof script === 'function' ? script(calls.length, options) : script.shift()
      if (step.failure !== undefined) {
        yield { type: 'finish', reason: { kind: 'error', failure: step.failure } }
        return
      }
      yield { type: 'text-delta', index: 0, text: step.text }
      yield { type: 'usage', usage: step.usage ?? { inputTokens: 1000, outputTokens: 100 } }
      yield { type: 'finish', reason: { kind: 'stop' } }
    },
  }
}

const attachments = {
  async saveImage({ data, mediaType }) {
    return { attachmentId: 'a1', mediaType, bytes: data.length, width: 1280, height: 960 }
  },
}

function projectOf(db) {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get('p1')
  return {
    id: row.id,
    theme: row.theme,
    modelRoute: row.model_route,
    modelId: row.model_id,
    budgetCny: row.budget_cny,
    concurrency: row.concurrency,
    gridCols: row.grid_cols,
    gridRows: row.grid_rows,
    thresholdKeep: row.threshold_keep,
    thresholdMaybe: row.threshold_maybe,
  }
}

test('runGridStage selects cells, rejects the rest and records costs', async () => {
  const { db, dir } = setup()
  addPhotos(db, 20)
  const project = projectOf(db)
  const llm = fakeLlm([
    { text: '["A1","B1"]' },
    { text: '["A1","C1"]' },
  ])
  const result = await runGridStage({
    db, projectId: 'p1', project, workspaceDir: dir, llm, attachments,
    thumbFor: solidThumb, now: OFF_PEAK,
  })
  assert.equal(result.grids, 2)
  assert.equal(result.selected, 4)
  assert.equal(result.rejected, 16)
  assert.equal(result.paused, false)
  assert.ok(result.spentCny > 0)

  const grids = db.prepare('SELECT status, selected_cells_json FROM grids ORDER BY seq').all()
  assert.deepEqual(grids.map(row => row.status), ['selected', 'selected'])
  assert.deepEqual(JSON.parse(grids[0].selected_cells_json), ['A1', 'B1'])

  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM photos WHERE state = 'grid_selected'").get().n, 4)
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM photos WHERE state = 'grid_rejected'").get().n, 16)
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM decisions WHERE source = 'ai' AND verdict = 'reject'").get().n, 16)
  assert.equal(db.prepare("SELECT status FROM stage_runs WHERE stage = 'grid'").get().status, 'done')
  assert.equal(db.prepare('SELECT status FROM projects WHERE id = ?').get('p1').status, 'gridded')
  db.close()
  rmSync(dir, { recursive: true, force: true })
})

test('runGridStage retries unparseable grids and keeps their photos as grid_error', async () => {
  const { db, dir } = setup()
  addPhotos(db, 20)
  const project = projectOf(db)
  const llm = fakeLlm(() => ({ text: '我拒绝回答' }))
  const result = await runGridStage({
    db, projectId: 'p1', project, workspaceDir: dir, llm, attachments,
    thumbFor: solidThumb, now: OFF_PEAK,
  })
  assert.equal(result.grids, 2)
  assert.equal(result.failed, 20)
  assert.equal(llm.calls.length, 4) // 每格首次 + 一次强化重试
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM photos WHERE state = 'grid_error'").get().n, 20)
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM decisions').get().n, 0)
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM errors').get().n, 2)
  assert.deepEqual(
    db.prepare('SELECT status FROM grids ORDER BY seq').all().map(row => row.status),
    ['parse_failed', 'parse_failed'],
  )
  db.close()
  rmSync(dir, { recursive: true, force: true })
})

test('runGridStage pauses when the budget is exhausted', async () => {
  const { db, dir } = setup({ budgetCny: 0.000001 })
  addPhotos(db, 20)
  const project = projectOf(db)
  const llm = fakeLlm([{ text: '["A1"]' }])
  const result = await runGridStage({
    db, projectId: 'p1', project, workspaceDir: dir, llm, attachments,
    thumbFor: solidThumb, now: OFF_PEAK,
  })
  assert.equal(result.paused, true)
  assert.equal(result.grids, 2)
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM grids').get().n, 1)
  assert.equal(db.prepare("SELECT status FROM stage_runs WHERE stage = 'grid'").get().status, 'paused')
  assert.equal(db.prepare('SELECT status FROM projects WHERE id = ?').get('p1').status, 'paused')
  db.close()
  rmSync(dir, { recursive: true, force: true })
})

test('runRankStage keeps the best frame and rejects the rest of the group', async () => {
  const { db, dir } = setup()
  addGroup(db, 'g1', 4)
  addPhotos(db, 4, { state: 'grid_selected', groupId: 'g1' })
  const project = projectOf(db)
  const llm = fakeLlm([{ text: '{"order":["A","C","B","D"],"best":"A","reason":"主体更实"}' }])
  const result = await runRankStage({
    db, projectId: 'p1', project, llm, now: OFF_PEAK,
  })
  assert.equal(result.groups, 1)
  assert.equal(result.kept, 3)
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM decisions WHERE verdict = 'reject'").get().n, 3)
  const assessment = db.prepare("SELECT * FROM assessments WHERE stage = 'rank'").get()
  assert.equal(assessment.target_kind, 'group')
  assert.equal(assessment.target_id, 'g1')
  assert.ok(assessment.cost_cny > 0)
  db.close()
  rmSync(dir, { recursive: true, force: true })
})

test('runScoreStage writes verdicts and never overwrites a human decision', async () => {
  const { db, dir } = setup()
  addPhotos(db, 2, { state: 'grid_selected' })
  db.prepare(`INSERT INTO decisions (photo_id, project_id, verdict, source, updated_at)
              VALUES ('p1', 'p1', 'keep', 'human', 0)`).run()
  const project = projectOf(db)
  const llm = fakeLlm([
    {
      text: JSON.stringify({
        score: 8.2,
        verdict: 'keep',
        dimensions: { composition: 8 },
        post_processing: ['crop_right'],
        reason: '好',
        edit_recipe: {
          version: 1,
          crop: { left: 0.1, top: 0.1, width: 0.8, height: 0.8 },
          rotate: 0,
          exposureEv: 0.2,
          contrast: 0,
          saturation: 0,
          sharpen: 0,
        },
      }),
    },
    { text: JSON.stringify({ score: 1, verdict: 'reject', dimensions: {}, post_processing: [], reason: '差' }) },
  ])
  const result = await runScoreStage({
    db, projectId: 'p1', project, llm, attachments,
    loadPhoto: async () => solidThumb(),
    now: OFF_PEAK,
  })
  assert.equal(result.scored, 2)
  const decisions = Object.fromEntries(
    db.prepare('SELECT photo_id, verdict, source FROM decisions').all().map(row => [row.photo_id, row]),
  )
  assert.deepEqual({ verdict: decisions.p1.verdict, source: decisions.p1.source }, { verdict: 'keep', source: 'human' })
  assert.deepEqual({ verdict: decisions.p0.verdict, source: decisions.p0.source }, { verdict: 'keep', source: 'ai' })
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM assessments WHERE stage = 'single'").get().n, 2)
  const row = db.prepare("SELECT recipe_json FROM assessments WHERE stage = 'single' LIMIT 1").get()
  assert.ok(row.recipe_json)
  assert.equal(JSON.parse(row.recipe_json).crop.left, 0.1)
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM photos WHERE state = 'scored'").get().n, 2)
  db.close()
  rmSync(dir, { recursive: true, force: true })
})

test('runScoreStage retries bad JSON and records a maybe decision on failure', async () => {
  const { db, dir } = setup()
  addPhotos(db, 1, { state: 'grid_selected' })
  const project = projectOf(db)
  const llm = fakeLlm(() => ({ text: 'not json' }))
  const result = await runScoreStage({
    db, projectId: 'p1', project, llm, attachments,
    loadPhoto: async () => solidThumb(),
    now: OFF_PEAK,
  })
  assert.equal(result.failed, 1)
  assert.equal(llm.calls.length, 2)
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM errors').get().n, 1)
  assert.equal(db.prepare('SELECT verdict FROM decisions').get().verdict, 'maybe')
  db.close()
  rmSync(dir, { recursive: true, force: true })
})
