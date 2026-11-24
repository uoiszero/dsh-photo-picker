import test from 'node:test'
import assert from 'node:assert/strict'
import { BUILTIN_CURVE_PRESETS } from '../src/client/curve-presets.js'
import { curvePath, isIdentityCurves, normalizeCurves } from '../src/shared/curves.js'

test('builtin curve presets are valid and non-identity', () => {
  assert.equal(BUILTIN_CURVE_PRESETS.length, 7)
  const ids = new Set()
  for (const preset of BUILTIN_CURVE_PRESETS) {
    assert.equal(ids.has(preset.id), false)
    ids.add(preset.id)
    const curves = normalizeCurves(preset.curves)
    assert.equal(isIdentityCurves(curves), false, preset.id)
    assert.match(curvePath(curves.master), /^M0,100/)
  }
})
