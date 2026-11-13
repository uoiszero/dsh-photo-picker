import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cropPixels, isIdentityRecipe, maxInscribedRect, normalizeRecipe, recipeSignature,
} from '../src/host/recipe.js'

test('normalizeRecipe returns null for missing or identity recipes', () => {
  assert.equal(normalizeRecipe(undefined), null)
  assert.equal(normalizeRecipe({}), null)
  assert.equal(normalizeRecipe({
    version: 1,
    crop: { left: 0, top: 0, width: 1, height: 1 },
    rotate: 0, exposureEv: 0, contrast: 0, saturation: 0, sharpen: 0,
  }), null)
})

test('normalizeRecipe clamps values and accepts cropped recipes', () => {
  const recipe = normalizeRecipe({
    version: 1,
    crop: { left: -1, top: 0.98, width: 2, height: 0.4 },
    rotate: 99, exposureEv: -9, contrast: 3, saturation: -3, sharpen: 9,
  })
  assert.ok(recipe)
  // 边界值按 schema 收敛：left ∈ [0, 0.95]，top ∈ [0, 0.95]，
  // width ∈ [0.05, 1-left]，height ∈ [0.05, 1-top]。
  assert.equal(recipe.crop.left, 0)
  assert.equal(recipe.crop.top, 0.95)
  assert.equal(recipe.crop.width, 1)
  assert.equal(recipe.crop.height, 0.05)
  assert.equal(recipe.rotate, 5)
  assert.equal(recipe.exposureEv, -2)
  assert.equal(recipe.contrast, 1)
  assert.equal(recipe.saturation, -1)
  assert.equal(recipe.sharpen, 2)
})

test('normalizeRecipe accepts Chinese aliases used by the model', () => {
  const recipe = normalizeRecipe({
    裁剪: { 左: 0.1, 上: 0.1, 宽: 0.8, 高: 0.8 },
    旋转: 1.5,
    曝光: 0.3,
    对比度: 0.1,
    饱和度: 0.1,
    锐化: 0.2,
  })
  assert.ok(recipe)
  assert.equal(recipe.crop.left, 0.1)
  assert.equal(recipe.rotate, 1.5)
  assert.equal(recipe.exposureEv, 0.3)
})

test('cropPixels converts normalized crop to pixels', () => {
  const recipe = normalizeRecipe({
    crop: { left: 0.25, top: 0.1, width: 0.5, height: 0.8 },
  })
  assert.deepEqual(cropPixels(recipe, 1600, 1000), { left: 400, top: 100, width: 800, height: 800 })
  assert.deepEqual(cropPixels(recipe, 10, 10), { left: 3, top: 1, width: 5, height: 8 })
})

test('recipeSignature is stable across key order', () => {
  const a = normalizeRecipe({ crop: { left: 0.1, top: 0.2, width: 0.6, height: 0.7 }, exposureEv: 0.2 })
  const b = normalizeRecipe({ exposureEv: 0.2, crop: { height: 0.7, width: 0.6, top: 0.2, left: 0.1 } })
  assert.equal(recipeSignature(a), recipeSignature(b))
  assert.equal(recipeSignature(a).length, 12)
})

test('isIdentityRecipe is true for the default recipe', () => {
  assert.equal(isIdentityRecipe({ crop: { left: 0, top: 0, width: 1, height: 1 }, rotate: 0, exposureEv: 0, contrast: 0, saturation: 0, sharpen: 0 }), true)
})


test('maxInscribedRect keeps the full frame at zero rotation and crops inside a rotated frame', () => {
  assert.deepEqual(maxInscribedRect(1600, 1000, 0), { width: 1600, height: 1000 })
  const inner = maxInscribedRect(1600, 1000, 2)
  assert.ok(inner.width < 1600)
  assert.ok(inner.height < 1000)
  assert.ok(inner.width > 0 && inner.height > 0)
  const portrait = maxInscribedRect(1000, 1600, 2)
  assert.ok(portrait.height > portrait.width)
})
