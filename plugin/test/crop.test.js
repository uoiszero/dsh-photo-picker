import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CROP_RATIOS, fitAspect, frameAspectOf, moveCrop, normalizeCrop, orientedAspect, resizeCrop,
} from '../src/client/crop.js'

test('orientedAspect follows frame orientation and swap', () => {
  assert.equal(orientedAspect(4 / 3, 16 / 9), 4 / 3)
  assert.equal(orientedAspect(4 / 3, 9 / 16), 3 / 4)
  assert.equal(orientedAspect(4 / 3, 16 / 9, true), 3 / 4)
  assert.equal(orientedAspect(1, 16 / 9, true), 1)
})

test('fitAspect centers the largest requested ratio within the frame', () => {
  const crop = fitAspect({ left: 0, top: 0, width: 1, height: 1 }, 16 / 9, 1)
  assert.ok(Math.abs(crop.width - 9 / 16) < 1e-9)
  assert.ok(Math.abs(crop.height - 1) < 1e-9)
  assert.ok(Math.abs(crop.left - (1 - 9 / 16) / 2) < 1e-9)
  assert.ok(Math.abs(crop.top) < 1e-9)
})

test('fitAspect preserves the current selection center', () => {
  const crop = fitAspect({ left: 0.2, top: 0.3, width: 0.2, height: 0.2 }, 1, 1)
  assert.ok(Math.abs((crop.left + crop.width / 2) - 0.3) < 1e-9)
  assert.ok(Math.abs((crop.top + crop.height / 2) - 0.4) < 1e-9)
})

test('moveCrop clamps the whole selection inside the frame', () => {
  assert.deepEqual(moveCrop({ left: 0.1, top: 0.1, width: 0.5, height: 0.5 }, 1, 1), {
    left: 0.5, top: 0.5, width: 0.5, height: 0.5,
  })
  assert.deepEqual(moveCrop({ left: 0.4, top: 0.4, width: 0.5, height: 0.5 }, -1, -1), {
    left: 0, top: 0, width: 0.5, height: 0.5,
  })
})

test('resizeCrop keeps aspect locked and clamps to frame', () => {
  const start = { left: 0.25, top: 0.25, width: 0.5, height: 0.5 }
  const wider = resizeCrop(start, 'e', 0.2, 0, 1, 1)
  assert.ok(Math.abs(wider.width - wider.height) < 1e-9)
  const taller = resizeCrop(start, 's', 0, 0.2, 1, 1)
  assert.ok(Math.abs(taller.width - taller.height) < 1e-9)
  const corner = resizeCrop(start, 'se', 0.2, 0, 1, 1)
  assert.ok(Math.abs(corner.width - corner.height) < 1e-9)
})

test('resizeCrop supports free aspect and minimum size', () => {
  const free = resizeCrop({ left: 0.2, top: 0.2, width: 0.6, height: 0.6 }, 'se', -0.7, -0.7, 1, null)
  assert.ok(free.width >= 0.05)
  assert.ok(free.height >= 0.05)
  assert.equal(normalizeCrop({ left: 0.9, top: 0.9, width: 0.4, height: 0.4 }).left, 0.6)
})

test('preset list contains the requested ratios', () => {
  assert.deepEqual(CROP_RATIOS.map(item => item.id), ['free', 'original', '4:3', '5:4', '1:1', '16:9', '16:10', '3:2'])
})

test('resizeCrop keeps the aspect ratio when clamped at the frame edge', () => {
  const start = { left: 0.7, top: 0.1, width: 0.2, height: 0.2 }
  const edge = resizeCrop(start, 'e', 0.5, 0, 1, 1)
  assert.ok(Math.abs(edge.width - edge.height) < 1e-9)
  assert.ok(edge.left + edge.width <= 1.0000001)
  const corner = resizeCrop({ left: 0.7, top: 0.7, width: 0.2, height: 0.2 }, 'se', 0.5, 0.5, 1, 1)
  assert.ok(Math.abs(corner.width - corner.height) < 1e-9)
  assert.ok(corner.left + corner.width <= 1.0000001)
  assert.ok(corner.top + corner.height <= 1.0000001)
})

test('fitAspect produces a physical square on a portrait frame', () => {
  const frameAspect = 2 / 3
  const crop = fitAspect({ left: 0, top: 0, width: 1, height: 1 }, frameAspect, 1)
  assert.ok(Math.abs((crop.width * frameAspect) / crop.height - 1) < 1e-9)
  assert.ok(Math.abs(crop.width - 1) < 1e-9)
})

test('frameAspectOf honors numeric and string EXIF orientation', () => {
  assert.equal(frameAspectOf(6000, 4000, 6), 2 / 3)
  assert.equal(frameAspectOf(6000, 4000, 'Rotate 270 CW'), 2 / 3)
  assert.equal(frameAspectOf(6000, 4000, 'Rotate 90 CW'), 2 / 3)
  assert.equal(frameAspectOf(6000, 4000, 'Horizontal (normal)'), 1.5)
  assert.equal(frameAspectOf(4000, 6000, 1), 2 / 3)
})
