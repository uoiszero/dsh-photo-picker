import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { renderEditedBuffer } from '../src/host/edit.js'
import { normalizeCurves } from '../src/shared/curves.js'

const baseRecipe = {
  version: 1,
  crop: { left: 0, top: 0, width: 1, height: 1 },
  rotate: 0,
  exposureEv: 0,
  contrast: 0,
  saturation: 0,
  sharpen: 0,
}

async function meanPixel(buffer) {
  const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true })
  return data.slice(0, info.width * info.height * 3).reduce((sum, value) => sum + value, 0)
    / (info.width * info.height * 3)
}

test('curve render changes a gray image and leaves identity pixels alone', async () => {
  const base = mkdtempSync(path.join(tmpdir(), 'pp-curve-render-'))
  const source = path.join(base, 'gray.png')
  await sharp({ create: { width: 12, height: 12, channels: 3, background: { r: 128, g: 128, b: 128 } } }).png().toFile(source)

  const identity = await renderEditedBuffer({ sourcePath: source, recipe: baseRecipe, maxWidth: 12 })
  const identityAgain = await renderEditedBuffer({ sourcePath: source, recipe: { ...baseRecipe, curves: normalizeCurves({}) }, maxWidth: 12 })
  const curved = await renderEditedBuffer({
    sourcePath: source,
    recipe: { ...baseRecipe, curves: normalizeCurves({ master: [[0, 0], [0.5, 0.75], [1, 1]] }) },
    maxWidth: 12,
  })

  const identityMean = await meanPixel(identity)
  assert.ok(Math.abs(identityMean - 128) < 4)
  assert.ok(Math.abs(identityMean - await meanPixel(identityAgain)) < 0.01)
  assert.ok(await meanPixel(curved) > identityMean + 10)
  rmSync(base, { recursive: true, force: true })
})

test('R/G/B curves apply after the master curve', async () => {
  const base = mkdtempSync(path.join(tmpdir(), 'pp-curve-render-'))
  const source = path.join(base, 'gray.png')
  await sharp({ create: { width: 12, height: 12, channels: 3, background: { r: 128, g: 128, b: 128 } } }).png().toFile(source)
  const buffer = await renderEditedBuffer({
    sourcePath: source,
    recipe: {
      ...baseRecipe,
      curves: normalizeCurves({ r: [[0, 0], [0.5, 0.62], [1, 1]] }),
    },
    maxWidth: 12,
  })
  const { data } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true })
  assert.ok(data[0] > data[1] + 8)
  assert.ok(data[0] > data[2] + 8)
  rmSync(base, { recursive: true, force: true })
})

test('brightness curve preserves hue better than a gray master curve', async () => {
  const base = mkdtempSync(path.join(tmpdir(), 'pp-curve-render-'))
  const source = path.join(base, 'warm.png')
  await sharp({ create: { width: 12, height: 12, channels: 3, background: { r: 150, g: 100, b: 70 } } }).png().toFile(source)
  const buffer = await renderEditedBuffer({
    sourcePath: source,
    recipe: {
      ...baseRecipe,
      curves: normalizeCurves({ luma: [[0, 0], [0.5, 0.68], [1, 1]] }),
    },
    maxWidth: 12,
  })
  const { data } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true })
  assert.ok(data[0] > data[1])
  assert.ok(data[1] > data[2])
  assert.ok(data[0] > 150)
  rmSync(base, { recursive: true, force: true })
})
