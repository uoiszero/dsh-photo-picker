import test from 'node:test'
import assert from 'node:assert/strict'
import {
  curvePath, curveLut, isIdentityCurve, isIdentityCurves, normalizeCurve, normalizeCurves, sampleCurve,
} from '../src/shared/curves.js'
import { isIdentityRecipe, normalizeRecipe, recipeSignature } from '../src/host/recipe.js'

test('normalizeCurve fixes endpoints, sorts x and deduplicates', () => {
  const points = normalizeCurve([[0.8, 0.9], [0.2, 0.1], [0.2, 0.2], [0, 0.4], [1, 0.7]])
  assert.deepEqual(points, [[0, 0], [0.2, 0.2], [0.8, 0.9], [1, 1]])
  assert.equal(isIdentityCurve([[0, 0], [1, 1]]), true)
  assert.equal(isIdentityCurve([[0, 0], [0.5, 0.6], [1, 1]]), false)
})

test('normalizeCurve caps control points and keeps endpoints', () => {
  const points = Array.from({ length: 30 }, (_, index) => [index / 29, index / 29])
  const normalized = normalizeCurve(points)
  assert.equal(normalized.length, 16)
  assert.deepEqual(normalized[0], [0, 0])
  assert.deepEqual(normalized[normalized.length - 1], [1, 1])
})

test('sampleCurve is monotone and preserves identity endpoints', () => {
  const identity = [[0, 0], [1, 1]]
  assert.equal(sampleCurve(identity, 0), 0)
  assert.equal(sampleCurve(identity, 0.5), 0.5)
  assert.equal(sampleCurve(identity, 1), 1)
  const s = [[0, 0], [0.25, 0.16], [0.5, 0.5], [0.75, 0.84], [1, 1]]
  let last = -1
  for (let index = 0; index <= 100; index++) {
    const value = sampleCurve(s, index / 100)
    assert.ok(value >= last)
    last = value
  }
})

test('curveLut and curvePath expose the same curve', () => {
  const points = [[0, 0], [0.5, 0.75], [1, 1]]
  const lut = curveLut(points)
  assert.equal(lut.length, 256)
  assert.equal(lut[0], 0)
  assert.equal(lut[255], 255)
  assert.ok(lut[128] > 128)
  assert.match(curvePath(points), /^M0,100/)
})

test('normalizeCurves and isIdentityCurves cover all channels', () => {
  const curves = normalizeCurves({ master: [[0, 0], [1, 1]] })
  assert.equal(isIdentityCurves(curves), true)
  assert.equal(isIdentityCurves({ ...curves, r: [[0, 0], [0.5, 0.4], [1, 1]] }), false)
})

test('recipes accept curves and include them in the signature', () => {
  const base = {
    version: 1,
    crop: { left: 0, top: 0, width: 1, height: 1 },
    rotate: 0,
    exposureEv: 0,
    contrast: 0,
    saturation: 0,
    sharpen: 0,
  }
  const identity = normalizeRecipe({ ...base, curves: normalizeCurves({}) })
  assert.equal(identity, null)
  assert.equal(isIdentityRecipe({ ...base, curves: normalizeCurves({}) }), true)
  const curved = normalizeRecipe({ ...base, curves: { master: [[0, 0], [0.5, 0.7], [1, 1]] } })
  assert.notEqual(curved, null)
  assert.ok(curved.curves.master.length > 2)
  assert.notEqual(recipeSignature(curved), recipeSignature(base))
})
