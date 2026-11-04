import test from 'node:test'
import assert from 'node:assert/strict'
import { createPhotoPickerExportTool, createPhotoPickerTool } from '../src/host/tools.js'

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

test('photo_picker_export preview forwards dest, buckets and mode', async () => {
  const calls = []
  const tool = createPhotoPickerExportTool({
    async resolveProject(ref) { return 'p1' },
    async exportPreview(id, options) { calls.push([id, options]); return { total: 2, counts: { keep: 2 } } },
    async exportRun() { throw new Error('should not run') },
  })
  const value = await tool.execute({
    action: 'preview', project: 'demo', dest: '/tmp/out', buckets: ['keep'], mode: 'copy',
  }, {})
  assert.deepEqual(calls, [['p1', { dest: '/tmp/out', buckets: ['keep'], mode: 'copy', layout: undefined }]])
  assert.deepEqual(JSON.parse(value.result), { total: 2, counts: { keep: 2 } })
})

test('photo_picker_export run calls exportRun', async () => {
  const calls = []
  const tool = createPhotoPickerExportTool({
    async resolveProject() { return 'p1' },
    async exportRun(id, options) { calls.push([id, options]); return { total: 1, manifestPath: '/tmp/out/manifest.csv' } },
    async exportPreview() { throw new Error('should not preview') },
  })
  const value = await tool.execute({ action: 'run', project: 'demo', dest: '/tmp/out' }, {})
  assert.deepEqual(calls, [['p1', { dest: '/tmp/out', buckets: undefined, mode: undefined, layout: undefined }]])
  assert.equal(JSON.parse(value.result).manifestPath, '/tmp/out/manifest.csv')
})
