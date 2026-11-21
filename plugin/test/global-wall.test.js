import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { openDb } from '../src/host/db.js'
import { toProject } from '../src/host/projects.js'
import { listGlobalPhotos } from '../src/host/global-wall.js'

function addProject(handles, { id, name, rows }) {
  const dir = mkdtempSync(path.join(tmpdir(), `pp-wall-${id}-`))
  const db = openDb(dir)
  const now = Date.now()
  db.prepare(`INSERT INTO projects (id, name, workspace_dir, source_kind, source_path,
      model_route, model_id, created_at, updated_at)
    VALUES (?, ?, ?, 'local', '/photos', 'deepseek-official', 'deepseek-flash', ?, ?)`)
    .run(id, name, dir, now, now)
  const insert = db.prepare(`INSERT INTO photos (id, project_id, rel_path, taken_at, thumb_path, state, created_at)
    VALUES (?, ?, ?, ?, ?, 'scored', ?)`)
  const assessment = db.prepare(`INSERT INTO assessments (id, project_id, target_kind, target_id, stage,
      score, verdict, scenes_json, created_at) VALUES (?, ?, 'photo', ?, 'single', ?, ?, ?, ?)`)
  for (const row of rows) {
    insert.run(`${id}-${row.id}`, id, row.relPath, row.takenAt, `thumbs/${row.id}.webp`, now)
    assessment.run(`a-${id}-${row.id}`, id, `${id}-${row.id}`, row.score, row.verdict, JSON.stringify(row.scenes ?? []), now)
  }
  const project = toProject(db.prepare('SELECT * FROM projects WHERE id = ?').get(id))
  handles[id] = { db, project, dir }
}

test('global wall merges projects and applies multi-project, scene and verdict filters', async () => {
  const handles = {}
  addProject(handles, {
    id: 'aaa', name: 'Alpha', rows: [
      { id: '1', relPath: 'a1.jpg', takenAt: 1, score: 9, verdict: 'keep', scenes: ['portrait'] },
      { id: '2', relPath: 'a2.jpg', takenAt: 2, score: 7, verdict: 'maybe', scenes: ['portrait', 'street'] },
      { id: '3', relPath: 'a3.jpg', takenAt: 3, score: 3, verdict: 'reject', scenes: ['landscape'] },
    ],
  })
  addProject(handles, {
    id: 'bbb', name: 'Beta', rows: [
      { id: '1', relPath: 'b1.jpg', takenAt: 4, score: 8, verdict: 'keep', scenes: ['landscape'] },
      { id: '2', relPath: 'b2.jpg', takenAt: 5, score: 6, verdict: 'maybe', scenes: ['architecture'] },
    ],
  })
  const store = {
    async list() {
      return Object.values(handles).map(({ project }) => ({ id: project.id, name: project.name, updatedAt: project.updatedAt }))
    },
    async open(id) { return handles[id] },
  }

  const all = await listGlobalPhotos({ store, filters: { limit: 120 } })
  assert.equal(all.total, 5)
  assert.equal(all.items[0].projectName, 'Alpha')
  assert.equal(all.items[0].score, 9)

  const oneProject = await listGlobalPhotos({ store, filters: { projectIds: ['bbb'] } })
  assert.equal(oneProject.total, 2)
  assert.deepEqual(oneProject.items.map(item => item.projectId), ['bbb', 'bbb'])

  const twoProjects = await listGlobalPhotos({ store, filters: { projectIds: ['aaa', 'bbb'], verdicts: ['keep'] } })
  assert.equal(twoProjects.total, 2)
  assert.deepEqual(new Set(twoProjects.items.map(item => item.projectName)), new Set(['Alpha', 'Beta']))

  const scenes = await listGlobalPhotos({ store, filters: { scenes: ['street', 'architecture'] } })
  assert.equal(scenes.total, 2)
  assert.deepEqual(new Set(scenes.items.map(item => item.projectId)), new Set(['aaa', 'bbb']))

  const page = await listGlobalPhotos({ store, filters: { limit: 2, offset: 1 } })
  assert.equal(page.total, 5)
  assert.equal(page.items.length, 2)

  for (const { db, dir } of Object.values(handles)) { db.close(); rmSync(dir, { recursive: true, force: true }) }
})
