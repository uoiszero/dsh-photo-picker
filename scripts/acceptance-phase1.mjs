import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ProjectStore } from '../plugin/src/host/projects.js'
import { LocalSource } from '../plugin/src/host/source.js'
import { scanProject } from '../plugin/src/host/scan.js'
import { preprocessProject } from '../plugin/src/host/preprocess.js'

const sourcePath = process.argv[2] ?? '/tmp/pp-fixtures'
const base = mkdtempSync(path.join(tmpdir(), 'pp-accept-'))
const store = new ProjectStore({
  dshHome: path.join(base, 'dsh'),
  workspaceRoot: path.join(base, 'work'),
})

const project = await store.create({ source: { kind: 'local', path: sourcePath }, name: 'acceptance' })
const { db } = await store.open(project.id)
const source = new LocalSource(project.sourcePath)

const scan = await scanProject({ db, projectId: project.id, source })
console.log('scan', scan)
assert.equal(scan.photos, 120)
assert.equal(scan.skipped, 0)

const pre = await preprocessProject({
  db,
  projectId: project.id,
  sourceRoot: project.sourcePath,
  workspaceDir: project.workspaceDir,
})
console.log('preprocess', pre)

const counts = Object.fromEntries(
  db.prepare('SELECT state, COUNT(*) AS n FROM photos WHERE project_id = ? GROUP BY state')
    .all(project.id).map(row => [row.state, row.n]),
)
console.log('counts', counts)
assert.equal(counts.filtered_dup, 20)
assert.equal(counts.filtered_small, 20)
assert.equal(counts.filtered_exposure, 20)
assert.ok(counts.ok >= 20, `expected survivors, got ${JSON.stringify(counts)}`)

const thumbs = db.prepare('SELECT COUNT(*) AS n FROM photos WHERE thumb_path IS NOT NULL').get().n
assert.ok(thumbs > 0)
console.log('PASS', { workspace: project.workspaceDir, counts, groups: pre.groups })
