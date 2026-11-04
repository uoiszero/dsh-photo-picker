import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { openDb } from '../src/host/db.js'
import { LocalSource } from '../src/host/source.js'
import { scanProject } from '../src/host/scan.js'

test('scan indexes supported files and skips hidden entries', async () => {
  const base = mkdtempSync(path.join(tmpdir(), 'pp-scan-'))
  const photos = path.join(base, 'photos')
  mkdirSync(photos)
  mkdirSync(path.join(photos, '.hidden'))
  mkdirSync(path.join(photos, 'sub'))
  writeFileSync(path.join(photos, 'a.jpg'), 'x')
  writeFileSync(path.join(photos, 'b.JPEG'), 'x')
  writeFileSync(path.join(photos, 'note.txt'), 'x')
  writeFileSync(path.join(photos, '.DS_Store'), 'x')
  writeFileSync(path.join(photos, 'sub', 'c.heic'), 'x')
  const db = openDb(path.join(base, 'db'))
  db.prepare(`INSERT INTO projects (id, name, workspace_dir, source_kind, source_path, created_at, updated_at)
              VALUES ('p1', 'p', ?, 'local', ?, 0, 0)`).run(path.join(base, 'db'), photos)

  const stats = await scanProject({ db, projectId: 'p1', source: new LocalSource(photos) })
  const rows = db.prepare('SELECT rel_path, format FROM photos ORDER BY rel_path').all()
  assert.deepEqual(rows.map(row => row.rel_path), ['a.jpg', 'b.JPEG', 'sub/c.heic'])
  assert.equal(stats.photos, 3)
  assert.equal(stats.skipped, 1)
  db.close()
  rmSync(base, { recursive: true, force: true })
})
