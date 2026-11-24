import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import {
  applyStyleTone, analyzeStyleSamples, buildStyleContactSheet, parseStyleAnalysis,
} from '../src/host/style-extract.js'
import { isIdentityCurves } from '../src/shared/curves.js'

test('style extraction produces bounded master and channel curves', async () => {
  const base = mkdtempSync(path.join(tmpdir(), 'pp-style-samples-'))
  const sample = path.join(base, 'sample.png')
  await sharp({ create: { width: 64, height: 64, channels: 3, background: { r: 120, g: 80, b: 50 } } }).png().toFile(sample)
  const result = await analyzeStyleSamples([sample])
  assert.equal(result.sampleCount, 1)
  assert.equal(isIdentityCurves(result.curves), false)
  assert.deepEqual(result.curves.master[0], [0, 0])
  assert.deepEqual(result.curves.master[result.curves.master.length - 1], [1, 1])
  for (const channel of ['master', 'r', 'g', 'b', 'luma']) {
    for (const [, y] of result.curves[channel]) assert.ok(y >= 0 && y <= 1)
  }
  const sheet = await buildStyleContactSheet([sample])
  const metadata = await sharp(sheet).metadata()
  assert.equal(metadata.width, 1200)
  assert.equal(metadata.height, 600)
  rmSync(base, { recursive: true, force: true })
})

test('parseStyleAnalysis accepts strict or fenced JSON and rejects garbage', () => {
  const parsed = parseStyleAnalysis('```json\n{"name":"Warm","description":"warm","tone":{"contrast":2,"warmth":-3},"tags":["film"],"confidence":3}\n```')
  assert.equal(parsed.name, 'Warm')
  assert.equal(parsed.tone.contrast, 0.5)
  assert.equal(parsed.tone.warmth, -0.5)
  assert.equal(parsed.confidence, 1)
  assert.equal(parseStyleAnalysis('not json'), null)
})

test('applyStyleTone keeps endpoints and changes the middle', async () => {
  const base = mkdtempSync(path.join(tmpdir(), 'pp-style-samples-'))
  const sample = path.join(base, 'sample.png')
  await sharp({ create: { width: 32, height: 32, channels: 3, background: { r: 90, g: 90, b: 90 } } }).png().toFile(sample)
  const local = await analyzeStyleSamples([sample])
  const adjusted = applyStyleTone(local.curves, { contrast: 0.3, shadows: 0.1, warmth: 0.2 })
  assert.deepEqual(adjusted.master[0], [0, 0])
  assert.deepEqual(adjusted.master[adjusted.master.length - 1], [1, 1])
  assert.notDeepEqual(adjusted.master, local.curves.master)
  rmSync(base, { recursive: true, force: true })
})
