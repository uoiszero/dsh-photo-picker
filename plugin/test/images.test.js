import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { deriveImage, hammingHex } from '../src/host/images.js'

async function makeImage(file, width, height, color) {
  await sharp({ create: { width, height, channels: 3, background: color } }).jpeg().toFile(file)
}

test('deriveImage returns a webp thumb, dhash and metrics', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pp-img-'))
  const file = path.join(dir, 'a.jpg')
  await makeImage(file, 1200, 800, '#8899aa')
  const derived = await deriveImage(file)
  assert.equal(derived.width, 1200)
  assert.equal(derived.height, 800)
  assert.equal(derived.dhash.length, 16)
  assert.ok(derived.thumb.length > 0)
  assert.ok(Number.isFinite(derived.blurScore))
  assert.ok(derived.clipLow >= 0 && derived.clipLow <= 1)
  rmSync(dir, { recursive: true, force: true })
})

test('dhash is stable for the same pixels and hammingHex counts differences', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pp-img-'))
  const a = path.join(dir, 'a.jpg')
  const b = path.join(dir, 'b.jpg')
  await makeImage(a, 800, 600, '#334455')
  await makeImage(b, 800, 600, '#334455')
  const da = await deriveImage(a)
  const db = await deriveImage(b)
  assert.equal(da.dhash, db.dhash)
  assert.equal(hammingHex(da.dhash, db.dhash), 0)
  rmSync(dir, { recursive: true, force: true })
})
