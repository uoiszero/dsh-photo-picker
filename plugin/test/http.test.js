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
    async startStage(id, stage, options = {}) {
      if (!['scan', 'preprocess', 'grid', 'rank', 'score'].includes(stage)) {
        const error = new Error(`unsupported stage: ${stage}`)
        error.code = 'BAD_STAGE'
        error.statusCode = 400
        throw error
      }
      return options.action === 'pause' ? { paused: stage } : { started: stage }
    },
    async checkpoints(id) { return [{ stage: 'grid', status: 'done', id }] },
    async reviewPhotos(id, options) { return { total: 1, options, items: [{ id: 'ph1', verdict: 'keep' }] } },
    async photoDetail(id, photoId) { return { id: photoId, verdict: 'keep' } },
    async setDecisions(id, body) { return { updated: body.photoIds.map(photoId => ({ photoId, verdict: body.verdict })) } },
    async stats(id) { return { verdicts: { keep: 1 }, id } },
    async group(id, gid) { return { id: gid, members: [] } },
    async groups(id, options) { return { total: 1, options, items: [{ id: 'g1' }] } },
    async calibrationSample(id, options) { return { available: 5, options, items: [] } },
    async calibrate(id, labels) { return { id: 'cal1', sampleSize: (labels ?? []).length } },
    async calibrationReport(id) { return { id: 'cal1', sampleSize: 3 } },
    async updateSettings(id, patch) { return { id, thresholdKeep: patch.thresholdKeep } },
    async promptInfo(projectId) { return { version: 'v1', project: projectId ?? null, prompts: { gridUser: 'x' } } },
    async models(route) { return { route, models: [{ id: 'deepseek-flash', inputModalities: ['text', 'image'] }] } },
    async previewFile() { return undefined },
    async exportPreview(id, options) { return { total: 2, dest: options.dest, counts: { keep: 2 } } },
    async exportRun(id, options) { return { total: 2, dest: options.dest, counts: { keep: 2 } } },
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

test('actions pass the requested operation and expose checkpoints', async () => {
  await withServer(async origin => {
    const started = await fetch(`${origin}/photo-picker/api/projects/p1/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'start', stage: 'grid' }),
    })
    assert.equal(started.status, 200)
    assert.deepEqual(await started.json(), { started: 'grid' })

    const paused = await fetch(`${origin}/photo-picker/api/projects/p1/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'pause', stage: 'grid' }),
    })
    assert.deepEqual(await paused.json(), { paused: 'grid' })

    const checkpoints = await fetch(`${origin}/photo-picker/api/projects/p1/checkpoints`)
    assert.deepEqual(await checkpoints.json(), [{ stage: 'grid', status: 'done', id: 'p1' }])
  })
})

test('an invalid stage returns 400 with a structured code', async () => {
  await withServer(async origin => {
    const response = await fetch(`${origin}/photo-picker/api/projects/p1/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'start', stage: 'nope' }),
    })
    assert.equal(response.status, 400)
    assert.equal((await response.json()).error.code, 'BAD_STAGE')
  })
})

test('review, decisions and export routes answer JSON', async () => {
  await withServer(async origin => {
    const photos = await fetch(`${origin}/photo-picker/api/projects/p1/photos?verdict=keep&sort=score&limit=10`)
    const photosBody = await photos.json()
    assert.equal(photosBody.total, 1)
    assert.equal(photosBody.options.verdict, 'keep')
    assert.equal(photosBody.options.limit, 10)

    const detail = await fetch(`${origin}/photo-picker/api/projects/p1/photos/ph1`)
    assert.deepEqual(await detail.json(), { id: 'ph1', verdict: 'keep' })

    const decisions = await fetch(`${origin}/photo-picker/api/projects/p1/decisions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ photoIds: ['ph1'], verdict: 'maybe' }),
    })
    assert.deepEqual(await decisions.json(), { updated: [{ photoId: 'ph1', verdict: 'maybe' }] })

    const stats = await fetch(`${origin}/photo-picker/api/projects/p1/stats`)
    assert.deepEqual(await stats.json(), { verdicts: { keep: 1 }, id: 'p1' })

    const exported = await fetch(`${origin}/photo-picker/api/projects/p1/export/preview`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ dest: '/tmp/out' }),
    })
    assert.deepEqual(await exported.json(), { total: 2, dest: '/tmp/out', counts: { keep: 2 } })

    const preview = await fetch(`${origin}/photo-picker/media/preview/p1/ph1`)
    assert.equal(preview.status, 404)
    assert.equal((await preview.json()).error.code, 'NOT_FOUND')
  })
})

test('groups, calibration and settings routes answer JSON', async () => {
  await withServer(async origin => {
    const groups = await fetch(`${origin}/photo-picker/api/projects/p1/groups?limit=5`)
    const groupsBody = await groups.json()
    assert.equal(groupsBody.options.limit, 5)
    assert.equal(groupsBody.total, 1)

    const sample = await fetch(`${origin}/photo-picker/api/projects/p1/calibration/sample?size=6`)
    assert.equal((await sample.json()).options.size, 6)

    const computed = await fetch(`${origin}/photo-picker/api/projects/p1/calibration`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ labels: [{ photoId: 'a', verdict: 'keep' }] }),
    })
    assert.deepEqual(await computed.json(), { id: 'cal1', sampleSize: 1 })

    const report = await fetch(`${origin}/photo-picker/api/projects/p1/calibration`)
    assert.equal((await report.json()).id, 'cal1')

    const patched = await fetch(`${origin}/photo-picker/api/projects/p1`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ thresholdKeep: 7.2 }),
    })
    assert.deepEqual(await patched.json(), { id: 'p1', thresholdKeep: 7.2 })
  })
})

test('prompt and model catalog routes answer JSON', async () => {
  await withServer(async origin => {
    const prompt = await fetch(`${origin}/photo-picker/api/prompt?project=p1`)
    const promptBody = await prompt.json()
    assert.equal(promptBody.version, 'v1')
    assert.equal(promptBody.project, 'p1')

    const models = await fetch(`${origin}/photo-picker/api/models?route=deepseek-official`)
    const modelsBody = await models.json()
    assert.equal(modelsBody.route, 'deepseek-official')
    assert.equal(modelsBody.models[0].id, 'deepseek-flash')
  })
})
