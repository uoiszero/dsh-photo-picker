import test from 'node:test'
import assert from 'node:assert/strict'
import { createPhotoPickerTool } from '../src/host/tools.js'

test('photo_picker list returns a JSON string result', async () => {
  const tool = createPhotoPickerTool({
    async listProjects() { return [{ id: 'p1', name: 'demo' }] },
  })
  const value = await tool.execute({ action: 'list' }, {})
  assert.equal(typeof value.result, 'string')
  assert.deepEqual(JSON.parse(value.result), [{ id: 'p1', name: 'demo' }])
})

test('photo_picker run_stage starts a stage', async () => {
  const started = []
  const tool = createPhotoPickerTool({
    async resolveProject(ref) { assert.equal(ref, 'demo'); return 'p1' },
    async startStage(id, stage) { started.push([id, stage]); return { started: stage } },
  })
  const value = await tool.execute({ action: 'run_stage', project: 'demo', stage: 'scan' }, {})
  assert.deepEqual(started, [['p1', 'scan']])
  assert.deepEqual(JSON.parse(value.result), { started: 'scan' })
})
