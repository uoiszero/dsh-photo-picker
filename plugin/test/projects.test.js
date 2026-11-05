import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ProjectStore } from '../src/host/projects.js'

function fixture() {
  const base = mkdtempSync(path.join(tmpdir(), 'pp-proj-'))
  const photos = path.join(base, 'photos')
  const dsh = path.join(base, 'dsh')
  mkdirSync(photos, { recursive: true })
  writeFileSync(path.join(photos, 'a.jpg'), '')
  return { base, photos, dsh }
}

test('createProject validates the source and persists a registry entry', async () => {
  const { base, photos, dsh } = fixture()
  const store = new ProjectStore({ dshHome: dsh, workspaceRoot: path.join(base, 'work') })
  const created = await store.create({
    source: { kind: 'local', path: photos },
    name: '测试项目',
    theme: 'mixed',
    budgetCny: 12,
  })
  assert.match(created.id, /^[A-Za-z0-9_-]{8,}$/)
  assert.equal(created.name, '测试项目')
  assert.equal(created.budgetCny, 12)
  assert.ok(created.workspaceDir.startsWith(path.join(base, 'work')))
  const listed = await store.list()
  assert.equal(listed.length, 1)
  assert.equal(listed[0].id, created.id)
  store.close(created.id)
  rmSync(base, { recursive: true, force: true })
})

test('createProject rejects a missing path and leaves no registry entry', async () => {
  const { base, dsh } = fixture()
  const store = new ProjectStore({ dshHome: dsh, workspaceRoot: path.join(base, 'work') })
  await assert.rejects(
    store.create({ source: { kind: 'local', path: path.join(base, 'nope') } }),
    /source path does not exist/,
  )
  assert.equal((await store.list()).length, 0)
  rmSync(base, { recursive: true, force: true })
})
