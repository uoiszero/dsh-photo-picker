import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { openDb } from '../src/host/db.js'
import {
  computeCalibration,
  lastCalibrationReport,
  sampleCalibration,
  saveCalibrationReport,
} from '../src/host/calibration.js'

function setup() {
  const dir = mkdtempSync(path.join(tmpdir(), 'pp-cal-'))
  const db = openDb(path.join(dir, 'db'))
  const now = Date.now()
  db.prepare(`INSERT INTO projects (id, name, workspace_dir, source_kind, source_path, created_at, updated_at)
              VALUES ('p1', 'test', ?, 'local', '/photos', ?, ?)`).run(dir, now, now)
  const addPhoto = db.prepare(`INSERT INTO photos (id, project_id, rel_path, size_bytes, mtime_ms,
      format, taken_at, thumb_path, state, created_at)
    VALUES (?, 'p1', ?, 10, 0, 'jpeg', ?, ?, 'scored', ?)`)
  const addAssessment = db.prepare(`INSERT INTO assessments (id, project_id, target_kind, target_id,
      stage, model_id, prompt_version, score, verdict, created_at)
    VALUES (?, 'p1', 'photo', ?, 'single', 'deepseek-flash', 'v1', ?, ?, ?)`)
  return { db, dir, addPhoto, addAssessment }
}

test('sampleCalibration returns a blind stratified sample', () => {
  const { db, dir, addPhoto, addAssessment } = setup()
  for (let index = 1; index <= 5; index++) {
    addPhoto.run(`p${index}`, `p${index}.jpg`, index * 1000, `thumbs/p${index}.webp`, 1)
    addAssessment.run(`a${index}`, `p${index}`, 5 + index, 'maybe', 1)
  }
  const sample = sampleCalibration(db, 'p1', { size: 2, random: () => 0.5 })
  assert.equal(sample.available, 5)
  assert.equal(sample.items.length, 2)
  assert.equal(new Set(sample.items.map(item => item.id)).size, 2)
  for (const item of sample.items) {
    assert.equal(item.score, undefined)
    assert.equal(item.verdict, undefined)
    assert.match(item.thumbUrl, /^\/photo-picker\/media\/thumb\/p1\//)
    assert.match(item.previewUrl, /^\/photo-picker\/media\/preview\/p1\//)
  }
  db.close()
  rmSync(dir, { recursive: true, force: true })
})

test('computeCalibration reports keep precision/recall/F1, agreement and a suggested threshold', () => {
  const { db, dir, addPhoto, addAssessment } = setup()
  const cases = [
    ['p1', 8.0, 'keep', 'keep'],
    ['p2', 6.2, 'maybe', 'maybe'],
    ['p3', 5.0, 'reject', 'reject'],
    ['p4', 9.0, 'keep', 'reject'],
    ['p5', 7.0, 'maybe', 'keep'],
  ]
  for (const [id, score, ai, human] of cases) {
    addPhoto.run(id, `${id}.jpg`, 1, `thumbs/${id}.webp`, 1)
    addAssessment.run(`a-${id}`, id, score, ai, 1)
  }
  // computeCalibration 以传入的 labels 为准，不读取 decisions。
  const report = computeCalibration(db, 'p1', cases.map(([id, , , human]) => ({ photoId: id, verdict: human })))
  assert.equal(report.sampleSize, 5)
  assert.equal(report.keep.tp, 1)
  assert.equal(report.keep.fp, 1)
  assert.equal(report.keep.fn, 1)
  assert.equal(report.keep.precision, 0.5)
  assert.equal(report.keep.recall, 0.5)
  assert.equal(report.keep.f1, 0.5)
  assert.equal(report.agreement, 0.6)
  assert.equal(report.thresholdCurve.length, 101)
  assert.equal(report.suggestedKeep, 7)
  assert.equal(report.suggestedMaybe, 5.5)
  const best = report.thresholdCurve.find(point => point.threshold === 7)
  assert.equal(best.f1, 0.8)
  db.close()
  rmSync(dir, { recursive: true, force: true })
})

test('saveCalibrationReport persists and lastCalibrationReport reads it back', () => {
  const { db, dir, addPhoto, addAssessment } = setup()
  addPhoto.run('p1', 'p1.jpg', 1, 'thumbs/p1.webp', 1)
  addAssessment.run('a1', 'p1', 8, 'keep', 1)
  const report = computeCalibration(db, 'p1', [{ photoId: 'p1', verdict: 'keep' }])
  const saved = saveCalibrationReport(db, 'p1', report)
  assert.ok(saved.id.length > 8)
  const latest = lastCalibrationReport(db, 'p1')
  assert.equal(latest.id, saved.id)
  assert.equal(latest.sampleSize, 1)
  assert.equal(latest.suggestedThreshold, report.suggestedKeep)
  assert.equal(latest.metrics.keep.f1, 1)
  assert.equal(lastCalibrationReport(db, 'missing'), null)
  db.close()
  rmSync(dir, { recursive: true, force: true })
})
