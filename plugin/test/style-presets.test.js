import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { deleteStylePreset, listStylePresets, saveStylePreset } from '../src/host/style-presets.js'
import { normalizeCurves } from '../src/shared/curves.js'

test('style presets save, list and delete without source paths', () => {
  const base = mkdtempSync(path.join(tmpdir(), 'pp-style-presets-'))
  const file = path.join(base, 'style-presets.json')
  const preset = saveStylePreset({
    name: ' Warm film ',
    sampleCount: 3,
    curves: normalizeCurves({ master: [[0, 0], [0.5, 0.6], [1, 1]] }),
    saturation: 0.2,
    analysis: { source: 'ai', description: 'warm', tags: ['film'] },
  }, file)
  assert.equal(preset.name, 'Warm film')
  assert.equal(listStylePresets(file).length, 1)
  assert.equal(readFileSync(file, 'utf8').includes('/photos/'), false)
  assert.equal(deleteStylePreset('missing', file), false)
  assert.equal(deleteStylePreset(preset.id, file), true)
  assert.equal(listStylePresets(file).length, 0)
  rmSync(base, { recursive: true, force: true })
})

test('style preset requires a name and clamps values', () => {
  const base = mkdtempSync(path.join(tmpdir(), 'pp-style-presets-'))
  const file = path.join(base, 'style-presets.json')
  const preset = saveStylePreset({
    name: 'x',
    sampleCount: 99,
    saturation: 9,
    curves: normalizeCurves({}),
  }, file)
  assert.equal(preset.sampleCount, 5)
  assert.equal(preset.saturation, 1)
  assert.throws(() => saveStylePreset({ name: '   ' }, file), /name/)
  rmSync(base, { recursive: true, force: true })
})
