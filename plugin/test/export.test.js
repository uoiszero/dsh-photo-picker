import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { openDb } from '../src/host/db.js'
import { previewExport, runExport } from '../src/host/export.js'

function setup() {
  const base = mkdtempSync(path.join(tmpdir(), 'pp-export-'))
  const source = path.join(base, 'source')
  const dest = path.join(base, 'dest')
  mkdirSync(path.join(source, 'day1'), { recursive: true })
  writeFileSync(path.join(source, 'day1', 'a.jpg'), 'a'.repeat(100))
  writeFileSync(path.join(source, 'day1', 'b.jpg'), 'b'.repeat(200))
  writeFileSync(path.join(source, 'c.jpg'), 'c'.repeat(300))

  const db = openDb(path.join(base, 'work'))
  const now = Date.now()
  db.prepare(`INSERT INTO projects (id, name, workspace_dir, source_kind, source_path, created_at, updated_at)
              VALUES ('p1', 'test', ?, 'local', ?, ?, ?)`).run(path.join(base, 'work'), source, now, now)
  const addPhoto = db.prepare(`INSERT INTO photos (id, project_id, rel_path, size_bytes, mtime_ms,
      format, thumb_path, state, created_at)
    VALUES (?, 'p1', ?, ?, 0, 'jpeg', ?, 'scored', ?)`)
  const addAssessment = db.prepare(`INSERT INTO assessments (id, project_id, target_kind, target_id,
      stage, model_id, prompt_version, score, verdict, reason, created_at)
    VALUES (?, 'p1', 'photo', ?, 'single', 'deepseek-flash', 'v1', ?, ?, ?, ?)`)
  addPhoto.run('a', 'day1/a.jpg', 100, 'thumbs/a.webp', now)
  addAssessment.run('aa', 'a', 8.4, 'keep', '好', now)
  addPhoto.run('b', 'day1/b.jpg', 200, 'thumbs/b.webp', now)
  addAssessment.run('ab', 'b', 8.1, 'keep', '好', now)
  addPhoto.run('c', 'c.jpg', 300, 'thumbs/c.webp', now)
  addAssessment.run('ac', 'c', 6.2, 'maybe', '中', now)
  return { base, source, dest, db }
}

test('previewExport summarizes buckets, bytes and conflicts', async () => {
  const { base, source, dest, db } = setup()
  const project = db.prepare("SELECT * FROM projects WHERE id = 'p1'").get()
  const preview = await previewExport({ db, project, dest })
  assert.equal(preview.total, 3)
  assert.deepEqual(preview.counts, { keep: 2, maybe: 1 })
  assert.equal(preview.totalBytes, 600)
  assert.equal(preview.conflictCount, 0)
  assert.equal(preview.skippedExisting, 0)
  assert.equal(preview.sameVolume, true)
  assert.equal(preview.mode, 'hardlink')

  // 目标目录已有同大小文件 → 计入 skippedExisting；不同大小 → 冲突
  mkdirSync(path.join(dest, 'keep', 'day1'), { recursive: true })
  writeFileSync(path.join(dest, 'keep', 'day1', 'a.jpg'), 'a'.repeat(100))
  writeFileSync(path.join(dest, 'keep', 'day1', 'b.jpg'), 'x'.repeat(50))
  const second = await previewExport({ db, project, dest })
  assert.equal(second.skippedExisting, 1)
  assert.equal(second.conflictCount, 1)
  assert.equal(second.conflicts[0].reason, 'size_mismatch')

  rmSync(base, { recursive: true, force: true })
})

test('runExport hardlinks buckets, writes manifests and never writes the source', async () => {
  const { base, source, dest, db } = setup()
  const project = db.prepare("SELECT * FROM projects WHERE id = 'p1'").get()
  const before = statSync(path.join(source, 'day1', 'a.jpg'))
  const result = await runExport({ db, project, dest })
  assert.deepEqual(result.counts, { keep: 2, maybe: 1 })
  assert.equal(result.total, 3)
  assert.equal(result.failures.length, 0)
  assert.ok(statSync(path.join(dest, 'keep', 'day1', 'a.jpg')).isFile())
  assert.ok(statSync(path.join(dest, 'maybe', 'c.jpg')).isFile())
  assert.equal(statSync(path.join(dest, 'keep', 'day1', 'a.jpg')).ino, statSync(path.join(source, 'day1', 'a.jpg')).ino)
  const after = statSync(path.join(source, 'day1', 'a.jpg'))
  assert.equal(after.size, before.size)
  assert.equal(after.mtimeMs, before.mtimeMs)
  assert.equal(after.ino, before.ino)

  const csv = readFileSync(path.join(dest, 'manifest.csv'), 'utf8').trim().split('\n')
  assert.equal(csv.length, 4)
  assert.match(csv[0], /^rel_path,bucket,verdict,ai_score,group_id,reason,dest_path$/)
  const json = JSON.parse(readFileSync(path.join(dest, 'manifest.json'), 'utf8'))
  assert.equal(json.items.length, 3)
  assert.equal(json.counts.keep, 2)

  const rerun = await runExport({ db, project, dest })
  assert.equal(rerun.skipped, 3)
  assert.equal(rerun.failures.length, 0)

  rmSync(base, { recursive: true, force: true })
})

test('runExport copy mode duplicates files', async () => {
  const { base, source, dest, db } = setup()
  const project = db.prepare("SELECT * FROM projects WHERE id = 'p1'").get()
  const result = await runExport({ db, project, dest, mode: 'copy', buckets: ['maybe'] })
  assert.deepEqual(result.counts, { maybe: 1 })
  const destFile = path.join(dest, 'maybe', 'c.jpg')
  assert.ok(statSync(destFile).isFile())
  assert.notEqual(statSync(destFile).ino, statSync(path.join(source, 'c.jpg')).ino)
  rmSync(base, { recursive: true, force: true })
})

test('export refuses a destination inside the source', async () => {
  const { base, source, db } = setup()
  const project = db.prepare("SELECT * FROM projects WHERE id = 'p1'").get()
  await assert.rejects(
    runExport({ db, project, dest: path.join(source, 'out') }),
    error => error.code === 'DEST_INSIDE_SOURCE',
  )
  assert.equal(statSync(source).isDirectory(), true)
  rmSync(base, { recursive: true, force: true })
})

test('export ignores grid_rejected and technically filtered photos', async () => {
  const { base, source, dest, db } = setup()
  writeFileSync(path.join(source, 'r.jpg'), 'r'.repeat(50))
  writeFileSync(path.join(source, 'f.jpg'), 'f'.repeat(60))
  const now = Date.now()
  const addPhoto = db.prepare(`INSERT INTO photos (id, project_id, rel_path, size_bytes, mtime_ms,
      format, thumb_path, state, created_at) VALUES (?, 'p1', ?, ?, 0, 'jpeg', ?, ?, ?)`)
  addPhoto.run('r', 'r.jpg', 50, 'thumbs/r.webp', 'grid_rejected', now)
  addPhoto.run('f', 'f.jpg', 60, 'thumbs/f.webp', 'filtered_exposure', now)
  db.prepare(`INSERT INTO decisions (photo_id, project_id, verdict, source, updated_at)
              VALUES ('r', 'p1', 'reject', 'ai', 0)`).run()

  const project = db.prepare("SELECT * FROM projects WHERE id = 'p1'").get()
  const preview = await previewExport({ db, project, dest })
  assert.equal(preview.total, 3)
  assert.deepEqual(preview.counts, { keep: 2, maybe: 1 })
  rmSync(base, { recursive: true, force: true })
})
