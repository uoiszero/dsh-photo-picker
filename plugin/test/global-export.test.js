import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { openDb } from '../src/host/db.js'
import { toProject } from '../src/host/projects.js'
import { previewGlobalExport, runGlobalExport } from '../src/host/global-export.js'

function setupProject({ id, name, files, verdicts }) {
  const dir = mkdtempSync(path.join(tmpdir(), `pp-global-export-${id}-`))
  const source = path.join(dir, 'source')
  mkdirSync(source)
  const db = openDb(path.join(dir, 'workspace'))
  const now = Date.now()
  db.prepare(`INSERT INTO projects (id, name, workspace_dir, source_kind, source_path,
      model_route, model_id, created_at, updated_at)
    VALUES (?, ?, ?, 'local', ?, 'deepseek-official', 'deepseek-flash', ?, ?)`)
    .run(id, name, path.join(dir, 'workspace'), source, now, now)
  const insert = db.prepare(`INSERT INTO photos (id, project_id, rel_path, size_bytes, mtime_ms,
      format, thumb_path, state, created_at) VALUES (?, ?, ?, ?, ?, 'jpeg', ?, 'scored', ?)`)
  const assessment = db.prepare(`INSERT INTO assessments (id, project_id, target_kind, target_id, stage,
      score, verdict, created_at) VALUES (?, ?, 'photo', ?, 'single', 8, ?, ?)`)
  files.forEach((relPath, index) => {
    const absolute = path.join(source, relPath)
    mkdirSync(path.dirname(absolute), { recursive: true })
    const content = `photo-${id}-${index}`
    writeFileSync(absolute, content)
    insert.run(`${id}-${index}`, id, relPath, Buffer.byteLength(content), now, `thumbs/${id}-${index}.webp`, now)
    assessment.run(`a-${id}-${index}`, id, `${id}-${index}`, verdicts[index] ?? 'keep', now)
  })
  const project = toProject(db.prepare('SELECT * FROM projects WHERE id = ?').get(id))
  return { db, project, dir, source }
}

function makeStore(projects) {
  return {
    async list() {
      return projects.map(({ project }) => ({ id: project.id, name: project.name, updatedAt: project.updatedAt }))
    },
    async open(id) {
      const found = projects.find(entry => entry.project.id === id)
      if (found === undefined) throw new Error(`unknown project: ${id}`)
      return found
    },
  }
}

test('global export filters buckets, writes project folders and a single manifest', async () => {
  const alpha = setupProject({
    id: 'alpha1', name: 'Alpha', files: ['a.jpg', 'b.jpg', 'c.jpg'],
    verdicts: ['keep', 'maybe', 'reject'],
  })
  const beta = setupProject({
    id: 'beta22', name: 'Beta', files: ['a.jpg', 'b.jpg'],
    verdicts: ['keep', 'maybe'],
  })
  const store = makeStore([alpha, beta])
  const dest = mkdtempSync(path.join(tmpdir(), 'pp-global-dest-'))

  const preview = await previewGlobalExport({
    store, dest, projectIds: ['alpha1', 'beta22'], buckets: ['keep', 'maybe'], layout: 'project', mode: 'copy', edit: 'none',
  })
  assert.equal(preview.total, 4)
  assert.deepEqual(preview.counts, { keep: 2, maybe: 2 })
  assert.equal(preview.byProject.alpha1.total, 2)
  assert.equal(preview.byProject.beta22.total, 2)

  const result = await runGlobalExport({
    store, dest, projectIds: ['alpha1', 'beta22'], buckets: ['keep', 'maybe'], layout: 'project', mode: 'copy', edit: 'none',
  })
  assert.equal(result.total, 4)
  assert.ok(result.manifestPath.endsWith('manifest.csv'))
  const alphaFolder = path.join(dest, 'alpha-alpha1', 'keep', 'a.jpg')
  const betaFolder = path.join(dest, 'beta-beta22', 'keep', 'a.jpg')
  assert.equal(readFileSync(alphaFolder, 'utf8'), 'photo-alpha1-0')
  assert.equal(readFileSync(betaFolder, 'utf8'), 'photo-beta22-0')
  const manifest = JSON.parse(readFileSync(path.join(dest, 'manifest.json'), 'utf8'))
  assert.deepEqual(manifest.projects.map(item => item.name), ['Alpha', 'Beta'])
  assert.equal(manifest.items.length, 4)
  assert.equal(manifest.items[0].projectName, 'Alpha')

  rmSync(dest, { recursive: true, force: true })
  for (const project of [alpha, beta]) { project.db.close(); rmSync(project.dir, { recursive: true, force: true }) }
})

test('global export supports explicit selected items and flat collision handling', async () => {
  const alpha = setupProject({ id: 'alpha1', name: 'Alpha', files: ['a.jpg', 'c.jpg'], verdicts: ['keep', 'reject'] })
  const beta = setupProject({ id: 'beta22', name: 'Beta', files: ['a.jpg'], verdicts: ['keep'] })
  const store = makeStore([alpha, beta])
  const dest = mkdtempSync(path.join(tmpdir(), 'pp-global-flat-'))
  const preview = await previewGlobalExport({
    store, dest, layout: 'flat', mode: 'copy', edit: 'none',
    items: [
      { projectId: 'alpha1', photoId: 'alpha1-0' },
      { projectId: 'beta22', photoId: 'beta22-0' },
    ],
  })
  assert.equal(preview.total, 2)
  assert.equal(preview.counts.keep, 2)
  const result = await runGlobalExport({
    store, dest, layout: 'flat', mode: 'copy', edit: 'none',
    items: [
      { projectId: 'alpha1', photoId: 'alpha1-0' },
      { projectId: 'beta22', photoId: 'beta22-0' },
    ],
  })
  assert.equal(result.total, 2)
  assert.ok(result.manifestPath.endsWith('manifest.csv'))
  const destinations = result.items.map(item => item.destPath)
  assert.equal(new Set(destinations).size, 2)
  assert.ok(destinations.some(item => item.includes('__beta22')))

  await assert.rejects(
    () => previewGlobalExport({ store, dest: alpha.source, projectIds: ['alpha1'], buckets: ['keep'] }),
    /dest must not be inside/,
  )

  rmSync(dest, { recursive: true, force: true })
  for (const project of [alpha, beta]) { project.db.close(); rmSync(project.dir, { recursive: true, force: true }) }
})
