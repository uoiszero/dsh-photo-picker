import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ProjectStore } from '../plugin/src/host/projects.js'
import { LocalSource } from '../plugin/src/host/source.js'
import { scanProject } from '../plugin/src/host/scan.js'
import { preprocessProject } from '../plugin/src/host/preprocess.js'
import { runGridStage, runRankStage, runScoreStage } from '../plugin/src/host/pipeline.js'
import { listReviewPhotos, projectStats, setHumanDecisions } from '../plugin/src/host/review.js'
import { previewExport, runExport } from '../plugin/src/host/export.js'

const sourcePath = process.argv[2] ?? '/tmp/pp-fixtures'
const base = mkdtempSync(path.join(tmpdir(), 'pp-accept-review-'))
const store = new ProjectStore({
  dshHome: path.join(base, 'dsh'),
  workspaceRoot: path.join(base, 'work'),
})

const created = await store.create({ source: { kind: 'local', path: sourcePath }, name: 'acceptance-review' })
const { db } = await store.open(created.id)
const project = await store.get(created.id)
const source = new LocalSource(project.sourcePath)
await scanProject({ db, projectId: project.id, source })
await preprocessProject({
  db, projectId: project.id, sourceRoot: project.sourcePath, workspaceDir: project.workspaceDir,
})

const llm = {
  async *stream(options) {
    const content = options.messages[0].content
    const text = content.map(block => block.text ?? '').join('')
    const hasImage = content.some(block => block.type === 'image')
    let reply
    if (hasImage && text.includes('网格图')) reply = '["A1","A2","B1","B2"]'
    else if (text.includes('同一场景或连拍')) {
      const count = Number(/共 (\d+) 张/.exec(text)?.[1] ?? 1)
      const labels = Array.from({ length: count }, (_, index) => String.fromCharCode(65 + index))
      reply = JSON.stringify({ order: labels, best: labels[0], reason: '排序' })
    } else if (hasImage && text.includes('六个维度')) {
      reply = JSON.stringify({
        score: 8.1,
        dimensions: { composition: 8, light: 8, color: 8, technique: 8, post_potential: 8, moment: 8 },
        verdict: 'keep',
        post_processing: ['crop_right'],
        reason: '验收',
      })
    } else throw new Error('unexpected prompt')
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

await runGridStage({ db, projectId: project.id, project, workspaceDir: project.workspaceDir, llm, attachments, thumbFor, now })
await runRankStage({ db, projectId: project.id, project, llm, now })
await runScoreStage({ db, projectId: project.id, project, llm, attachments, loadPhoto, now })

// 复核
const review = listReviewPhotos(db, project.id, { limit: 10 })
console.log('review', { total: review.total, sample: review.items[0] })
assert.ok(review.total > 0)
assert.ok(review.items.every(item => item.verdict === 'keep' || item.verdict === 'maybe' || item.verdict === 'reject'))
assert.ok(review.items[0].score !== null)

const keepTargets = review.items.slice(0, 3).map(item => item.id)
setHumanDecisions(db, project.id, keepTargets, 'keep')
const humanKeeps = listReviewPhotos(db, project.id, { verdict: 'keep' })
assert.ok(humanKeeps.items.length >= keepTargets.length)

const stats = projectStats(db, project.id)
console.log('stats', stats.verdicts)
assert.ok((stats.verdicts.keep ?? 0) >= keepTargets.length)

// 源文件抽样（导出前后校验）
const sampleRel = ['u-00.jpg', 'u-20.jpg', 'w-00.jpg', 's-00.jpg', 'p-00.jpg']
const digest = name => createHash('sha256').update(readFileSync(path.join(project.sourcePath, name))).digest('hex')
const before = Object.fromEntries(sampleRel.map(name => [name, digest(name)]))

// 导出
const dest = path.join(base, 'export')
const preview = await previewExport({ db, project, dest })
console.log('preview', preview.counts, preview.total)
assert.ok(preview.total >= keepTargets.length)
assert.equal(preview.conflictCount, 0)
const run = await runExport({ db, project, dest })
console.log('run', run.counts, 'failures', run.failureCount)
assert.equal(run.failureCount, 0)
assert.ok(existsSync(path.join(dest, 'manifest.csv')))
assert.ok(existsSync(path.join(dest, 'manifest.json')))
assert.ok(run.total >= keepTargets.length)

for (const bucket of ['keep', 'maybe']) {
  for (const item of listReviewPhotos(db, project.id, { verdict: bucket, limit: 200 }).items) {
    if (item.humanVerdict === null && item.verdict !== bucket) continue
    assert.ok(existsSync(path.join(dest, bucket, item.relPath)), `missing export ${bucket}/${item.relPath}`)
  }
}

const after = Object.fromEntries(sampleRel.map(name => [name, digest(name)]))
assert.deepEqual(after, before)

const rerun = await runExport({ db, project, dest })
assert.equal(rerun.failures.length, 0)
assert.equal(rerun.skipped + rerun.failureCount, run.total)

console.log('PASS', { review: review.total, counts: run.counts, manifest: run.manifestPath })
