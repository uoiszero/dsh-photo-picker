import test from 'node:test'
import assert from 'node:assert/strict'
import { runPipeline } from '../src/host/orchestrator.js'

test('runPipeline runs every stage in order and reports completion', async () => {
  const seen = []
  const events = []
  const result = await runPipeline({
    stages: ['scan', 'preprocess', 'grid', 'rank', 'score'],
    runStage: async stage => { seen.push(stage); return { paused: false } },
    onStage: event => events.push(`${event.phase}:${event.stage}`),
  })
  assert.deepEqual(seen, ['scan', 'preprocess', 'grid', 'rank', 'score'])
  assert.deepEqual(result, { completed: seen, stoppedAt: null, reason: 'done' })
  assert.equal(events[0], 'start:scan')
  assert.equal(events[events.length - 1], 'done:score')
})

test('runPipeline stops when a stage reports a budget pause', async () => {
  const seen = []
  const result = await runPipeline({
    stages: ['scan', 'preprocess', 'grid', 'rank', 'score'],
    runStage: async stage => {
      seen.push(stage)
      return { paused: stage === 'grid' }
    },
  })
  assert.deepEqual(seen, ['scan', 'preprocess', 'grid'])
  assert.equal(result.reason, 'paused')
  assert.equal(result.stoppedAt, 'grid')
})

test('runPipeline honours pauseBetween for stage-by-stage runs', async () => {
  const seen = []
  const result = await runPipeline({
    stages: ['scan', 'preprocess', 'grid'],
    runStage: async stage => { seen.push(stage); return {} },
    pauseBetween: true,
  })
  assert.deepEqual(seen, ['scan'])
  assert.deepEqual(result.completed, ['scan'])
  assert.equal(result.stoppedAt, 'preprocess')
  assert.equal(result.reason, 'paused')
})

test('runPipeline aborts between stages', async () => {
  const controller = new AbortController()
  const seen = []
  const result = await runPipeline({
    stages: ['scan', 'preprocess', 'grid'],
    signal: controller.signal,
    runStage: async stage => {
      seen.push(stage)
      if (stage === 'scan') controller.abort()
      return {}
    },
  })
  assert.deepEqual(seen, ['scan'])
  assert.equal(result.reason, 'aborted')
  assert.equal(result.stoppedAt, 'preprocess')
})
