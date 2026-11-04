import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { openDb } from '../src/host/db.js'

test('openDb creates the full schema in WAL mode', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pp-db-'))
  const db = openDb(dir)
  const tables = db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  ).all().map(row => row.name)
  for (const table of [
    'projects', 'photos', 'groups', 'grids', 'stage_runs', 'assessments',
    'decisions', 'exports', 'errors', 'mounts', 'calibration_reports',
  ]) {
    assert.ok(tables.includes(table), `missing table ${table}`)
  }
  assert.equal(db.prepare('PRAGMA journal_mode').get().journal_mode, 'wal')
  db.close()
  rmSync(dir, { recursive: true, force: true })
})
