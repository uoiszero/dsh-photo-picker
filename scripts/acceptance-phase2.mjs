import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ProjectStore } from '../plugin/src/host/projects.js'
import { LocalSource } from '../plugin/src/host/source.js'
import { scanProject } from '../plugin/src/host/scan.js'
import { preprocessProject } from '../plugin/src/host/preprocess.js'
import { runGridStage, runRankStage, runScoreStage } from '../plugin/src/host/pipeline.js'

const sourcePath = process.argv[2] ?? '/tmp/pp-fixtures'
const base = mkdtempSync(path.join(tmpdir(), 'pp-accept-ai-'))
const store = new ProjectStore({
  dshHome: path.join(base, 'dsh'),
  workspaceRoot: path.join(base, 'work'),
})

const created = await store.create({ source: { kind: 'local', path: sourcePath }, name: 'acceptance-ai' })
const { db } = await store.open(created.id)
const project = await store.get(created.id)
const source = new LocalSource(project.sourcePath)

await scanProject({ db, projectId: project.id, source })
await preprocessProject({
  db,
  projectId: project.id,
  sourceRoot: project.sourcePath,
  workspaceDir: project.workspaceDir,
})

const calls = { grid: 0, rank: 0, score: 0 }

/** 假 LLM：按提示词分类返回合法结果，不发真实请求。 */
const llm = {
  async *stream(options) {
    const content = options.messages[0].content
    const text = content.map(block => block.text ?? '').join('')
    const hasImage = content.some(block => block.type === 'image')
    let reply
    if (hasImage && text.includes('网格图')) {
      calls.grid += 1
      reply = '["A1","B1"]'
    } else if (text.includes('同一场景或连拍')) {
      calls.rank += 1
      const count = Number(/共 (\d+) 张/.exec(text)?.[1] ?? 1)
      const labels = Array.from({ length: count }, (_, index) => String.fromCharCode(65 + index))
      reply = JSON.stringify({ order: labels, best: labels[0], reason: '排序完成' })
    } else if (hasImage && text.includes('六个维度')) {
      calls.score += 1
      reply = JSON.stringify({
        score: 8.1,
        dimensions: { composition: 8, light: 8, color: 8, technique: 8, post_potential: 8, moment: 8 },
        verdict: 'keep',
        post_processing: ['crop_right'],
        reason: '测试样本',
      })
    } else {
      throw new Error(`unexpected prompt: ${text.slice(0, 40)}`)
    }
    yield { type: 'text-delta', index: 0, text: reply }
    yield { type: 'usage', usage: { inputTokens: 800, outputTokens: 100 } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  },
}

const attachments = {
  async saveImage({ data, mediaType }) {
    return { attachmentId: 'acceptance', mediaType, bytes: data.length, width: 1280, height: 960 }
  },
}
const thumbFor = photo => readFile(path.join(project.workspaceDir, photo.thumb_path)).catch(() => undefined)
const loadPhoto = photo => path.join(project.sourcePath, photo.rel_path)
const now = () => new Date(2026, 10, 4, 20, 0)

const counts = Object.fromEntries(
  db.prepare('SELECT state, COUNT(*) AS n FROM photos WHERE project_id = ? GROUP BY state')
    .all(project.id).map(row => [row.state, row.n]),
)
const candidates = counts.ok ?? 0
console.log('candidates', candidates)

const grid = await runGridStage({
  db, projectId: project.id, project, workspaceDir: project.workspaceDir,
  llm, attachments, thumbFor, now,
})
console.log('grid', grid)
// 分组感知打包可能产生比 candidates/16 更多的格（组不跨格），所以以实际格数为准。
assert.equal(calls.grid, grid.grids)
assert.ok(grid.selected > 0)
assert.equal(db.prepare("SELECT COUNT(*) AS n FROM grids").get().n, grid.grids)
assert.ok(grid.spentCny > 0)

const rank = await runRankStage({ db, projectId: project.id, project, llm, now })
console.log('rank', rank)
assert.equal(rank.paused, false)

const score = await runScoreStage({
  db, projectId: project.id, project, llm, attachments, loadPhoto, now,
})
console.log('score', score)
// 组内排序会淘汰一部分入选照片，所以精评数量 <= 粗筛选中数。
assert.ok(score.scored > 0)
assert.ok(score.scored <= grid.selected)
assert.equal(calls.score, score.scored)
assert.ok(score.spentCny > 0)

const verdicts = Object.fromEntries(
  db.prepare("SELECT verdict, COUNT(*) AS n FROM decisions WHERE source = 'ai' GROUP BY verdict")
    .all().map(row => [row.verdict, row.n]),
)
console.log('verdicts', verdicts)
assert.equal(verdicts.keep, score.scored)
assert.equal(Object.values(verdicts).reduce((sum, n) => sum + n, 0), candidates)

const scoreCallsBefore = calls.score
await runScoreStage({ db, projectId: project.id, project, llm, attachments, loadPhoto, now })
assert.equal(calls.score, scoreCallsBefore, 're-running score must not re-bill finished photos')

const assessments = db.prepare("SELECT COUNT(*) AS n FROM assessments WHERE stage = 'single'").get().n
assert.equal(assessments, score.scored)

const totalCost = db.prepare('SELECT COALESCE(SUM(cost_cny), 0) AS c FROM stage_runs').get().c
console.log('PASS', { candidates, calls, gridSelected: grid.selected, totalCost })
