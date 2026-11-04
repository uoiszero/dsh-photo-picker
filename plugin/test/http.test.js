import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createHttpHandler } from '../src/host/http.js'

function stub() {
  return {
    events: { on() {}, off() {} },
    async listProjects() { return [{ id: 'p1', name: 'demo' }] },
    async createProject(body) { return { id: 'p2', name: body.name } },
    async getProjectDetail(id) { return { id, counts: {} } },
    async listPhotos() { return [] },
    async startStage(id, stage) { return { started: stage } },
    async listDir() { return [{ name: 'Pictures', path: '/Users/x/Pictures' }] },
    async chooseFolder() { return '/Users/x/Pictures' },
    async thumbFile() { return undefined },
  }
}

async function withServer(run) {
  const server = createServer(createHttpHandler(stub()))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  try {
    await run(origin)
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
}

test('health and project routes answer JSON', async () => {
  await withServer(async origin => {
    const health = await fetch(`${origin}/photo-picker/api/health`)
    assert.equal(health.status, 200)
    assert.deepEqual(await health.json(), { ok: true })

    const list = await fetch(`${origin}/photo-picker/api/projects`)
    assert.deepEqual(await list.json(), [{ id: 'p1', name: 'demo' }])

    const created = await fetch(`${origin}/photo-picker/api/projects`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'new' }),
    })
    assert.equal(created.status, 201)
    assert.deepEqual(await created.json(), { id: 'p2', name: 'new' })
  })
})

test('unknown route returns a structured 404', async () => {
  await withServer(async origin => {
    const response = await fetch(`${origin}/photo-picker/nope`)
    assert.equal(response.status, 404)
    assert.equal((await response.json()).error.code, 'NOT_FOUND')
  })
})
