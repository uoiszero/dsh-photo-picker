import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { openDb } from '../src/host/db.js'
import {
  getPhotoDetail,
  listReviewPhotos,
  projectStats,
  setHumanDecisions,
} from '../src/host/review.js'

function setup() {
  const dir = mkdtempSync(path.join(tmpdir(), 'pp-review-'))
  const db = openDb(path.join(dir, 'db'))
  const now = Date.now()
  db.prepare(`INSERT INTO projects (id, name, workspace_dir, source_kind, source_path, created_at, updated_at)
              VALUES ('p1', 'test', ?, 'local', '/photos', ?, ?)`).run(dir, now, now)
  const addPhoto = db.prepare(`INSERT INTO photos (id, project_id, rel_path, size_bytes, mtime_ms,
      format, taken_at, group_id, thumb_path, state, created_at)
    VALUES (?, 'p1', ?, 10, ?, 'jpeg', ?, ?, ?, ?, ?)`)
  const addAssessment = db.prepare(`INSERT INTO assessments (id, project_id, target_kind, target_id,
      stage, model_id, prompt_version, score, verdict, dimensions_json, post_processing_json,
      reason, created_at)
    VALUES (?, 'p1', 'photo', ?, 'single', 'deepseek-flash', 'v1', ?, ?, ?, ?, ?, ?)`)
  return { db, dir, addPhoto, addAssessment }
}

test('listReviewPhotos resolves human > ai > maybe and hides filtered states by default', () => {
  const { db, dir, addPhoto, addAssessment } = setup()
  addPhoto.run('a', 'a.jpg', 100, 1, null, 'thumbs/a.webp', 'scored', 1)
  addAssessment.run('aa', 'a', 8.5, 'keep', '{"composition":8}', '["crop_right"]', '很好', 1)
  addPhoto.run('b', 'b.jpg', 200, 2, null, 'thumbs/b.webp', 'scored', 2)
  addAssessment.run('ab', 'b', 6.4, 'maybe', '{}', '[]', '一般', 2)
  addPhoto.run('c', 'c.jpg', 300, 3, null, 'thumbs/c.webp', 'scored', 3)
  addAssessment.run('ac', 'c', 4.1, 'reject', '{}', '[]', '差', 3)
  addPhoto.run('d', 'd.jpg', 400, 4, null, 'thumbs/d.webp', 'grid_selected', 4)
  addPhoto.run('e', 'e.jpg', 500, 5, null, 'thumbs/e.webp', 'grid_rejected', 5)
  db.prepare(`INSERT INTO decisions (photo_id, project_id, verdict, source, updated_at)
              VALUES ('e', 'p1', 'reject', 'ai', 0)`).run()
  addPhoto.run('f', 'f.jpg', 600, 6, null, null, 'filtered_dup', 6)

  db.prepare(`INSERT INTO decisions (photo_id, project_id, verdict, source, updated_at)
              VALUES ('c', 'p1', 'keep', 'human', 0)`).run()

  const { items, total } = listReviewPhotos(db, 'p1')
  assert.equal(total, 4) // a,b,c,d；grid_rejected 与 filtered_dup 被默认排除
  const byId = Object.fromEntries(items.map(item => [item.id, item]))
  assert.equal(byId.a.verdict, 'keep')
  assert.equal(byId.b.verdict, 'maybe')
  assert.equal(byId.c.verdict, 'keep')
  assert.equal(byId.c.aiVerdict, 'reject')
  assert.equal(byId.c.humanVerdict, 'keep')
  assert.equal(byId.d.verdict, 'maybe')
  assert.equal(byId.a.score, 8.5)
  assert.deepEqual(byId.a.postProcessing, ['crop_right'])
  assert.equal(items[0].id, 'a') // 默认按分数降序
  assert.equal(items[items.length - 1].id, 'd') // 无分数排最后

  const keepOnly = listReviewPhotos(db, 'p1', { verdict: 'keep' })
  assert.deepEqual(keepOnly.items.map(item => item.id).sort(), ['a', 'c'])

  const all = listReviewPhotos(db, 'p1', { scope: 'all' })
  assert.equal(all.total, 5) // 加上 grid_rejected（f 无缩略图仍排除）
  const rejected = all.items.find(item => item.id === 'e')
  assert.equal(rejected.verdict, 'reject') // 读取 AI 决策，而不是默认 maybe

  rmSync(dir, { recursive: true, force: true })
})

test('getPhotoDetail returns the group ranking', () => {
  const { db, dir, addPhoto, addAssessment } = setup()
  addPhoto.run('g1', 'g1.jpg', 100, 1, 'grp', 'thumbs/g1.webp', 'scored', 1)
  addPhoto.run('g2', 'g2.jpg', 200, 2, 'grp', 'thumbs/g2.webp', 'scored', 2)
  addAssessment.run('x1', 'g1', 8, 'keep', '{}', '[]', '较好', 1)
  addAssessment.run('x2', 'g2', 6, 'maybe', '{}', '[]', '一般', 2)

  const best = getPhotoDetail(db, 'p1', 'g1')
  assert.equal(best.group.id, 'grp')
  assert.equal(best.group.rank, 1)
  assert.equal(best.group.size, 2)
  const worse = getPhotoDetail(db, 'p1', 'g2')
  assert.equal(worse.group.rank, 2)
  rmSync(dir, { recursive: true, force: true })
})

test('setHumanDecisions writes human rows and rejects unknown verdicts', () => {
  const { db, dir, addPhoto, addAssessment } = setup()
  addPhoto.run('a', 'a.jpg', 100, 1, null, 'thumbs/a.webp', 'scored', 1)
  addAssessment.run('aa', 'a', 4, 'reject', '{}', '[]', '差', 1)
  addPhoto.run('b', 'b.jpg', 200, 2, null, 'thumbs/b.webp', 'scored', 2)

  const result = setHumanDecisions(db, 'p1', ['a', 'b', 'missing'], 'keep')
  assert.deepEqual(result.updated.map(row => row.photoId).sort(), ['a', 'b'])
  const rows = db.prepare("SELECT photo_id, verdict, source FROM decisions ORDER BY photo_id").all()
  assert.deepEqual(rows.map(row => [row.photo_id, row.verdict, row.source]), [
    ['a', 'keep', 'human'],
    ['b', 'keep', 'human'],
  ])
  assert.throws(() => setHumanDecisions(db, 'p1', ['a'], 'great'), error => error.code === 'BAD_VERDICT')

  const cleared = setHumanDecisions(db, 'p1', ['a'], 'auto')
  assert.deepEqual(cleared.updated, [{ photoId: 'a', verdict: null }])
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM decisions WHERE photo_id = 'a'").get().n, 0)
  rmSync(dir, { recursive: true, force: true })
})

test('projectStats counts verdicts and buckets scores', () => {
  const { db, dir, addPhoto, addAssessment } = setup()
  addPhoto.run('a', 'a.jpg', 100, 1, null, 'thumbs/a.webp', 'scored', 1)
  addAssessment.run('aa', 'a', 8.5, 'keep', '{}', '[]', '好', 1)
  addPhoto.run('b', 'b.jpg', 200, 2, null, 'thumbs/b.webp', 'scored', 2)
  addAssessment.run('ab', 'b', 6.4, 'maybe', '{}', '[]', '中', 2)
  addPhoto.run('c', 'c.jpg', 300, 3, null, 'thumbs/c.webp', 'scored', 3)
  addAssessment.run('ac', 'c', 6.9, 'maybe', '{}', '[]', '中', 3)

  const stats = projectStats(db, 'p1')
  assert.deepEqual(stats.verdicts, { keep: 1, maybe: 2 })
  assert.equal(stats.states.scored, 3)
  const buckets = Object.fromEntries(stats.histogram.map(item => [item.bucket, item.count]))
  assert.equal(buckets[8], 1)
  assert.equal(buckets[6], 2)
  rmSync(dir, { recursive: true, force: true })
})
