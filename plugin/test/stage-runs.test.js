import test from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { openDb } from '../src/host/db.js'

test('openDb adds AI run columns to an old stage_runs table', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pp-stage-runs-'))
  const file = path.join(dir, 'db.sqlite')
  const old = new DatabaseSync(file)
  old.exec(`CREATE TABLE stage_runs (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, stage TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', cursor TEXT, stats_json TEXT,
    cost_cny REAL NOT NULL DEFAULT 0, error TEXT, started_at INTEGER, finished_at INTEGER
  )`)
  old.prepare(`INSERT INTO stage_runs (id, project_id, stage, status, started_at)
               VALUES ('r1', 'p1', 'grid', 'done', 1)`).run()
  old.close()

  const db = openDb(dir)
  const columns = db.prepare('PRAGMA table_info(stage_runs)').all().map(row => row.name)
  for (const column of ['model_route', 'model_id', 'prompt_version', 'tokens_in', 'tokens_out', 'call_count', 'error_code']) {
    assert.ok(columns.includes(column), column)
  }
  const row = db.prepare("SELECT * FROM stage_runs WHERE id = 'r1'").get()
  assert.equal(row.tokens_in, 0)
  assert.equal(row.model_id, null)
  db.close()
  rmSync(dir, { recursive: true, force: true })
})
