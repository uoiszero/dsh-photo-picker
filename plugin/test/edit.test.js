import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { normalizeRecipe } from '../src/host/recipe.js'
import { renderEditedBuffer, renderEditedFile } from '../src/host/edit.js'

test('renderEditedBuffer crops and encodes JPEG', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pp-edit-'))
  const source = path.join(dir, 'source.jpg')
  await sharp({ create: { width: 1600, height: 1000, channels: 3, background: '#336699' } }).jpeg().toFile(source)
  const recipe = normalizeRecipe({ crop: { left: 0.25, top: 0.1, width: 0.5, height: 0.8 } })
  const output = await renderEditedBuffer({ sourcePath: source, recipe })
  const meta = await sharp(output).metadata()
  assert.equal(meta.format, 'jpeg')
  assert.equal(meta.width, 800)
  assert.equal(meta.height, 800)
  rmSync(dir, { recursive: true, force: true })
})

test('renderEditedFile caches by recipe signature and leaves source untouched', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pp-edit-'))
  const source = path.join(dir, 'source.jpg')
  await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#8899aa' } }).jpeg().toFile(source)
  const before = statSync(source)
  const recipe = normalizeRecipe({ exposureEv: 0.5, saturation: 0.1 })
  const cache = path.join(dir, 'edits', 'photo.jpg')
  const first = await renderEditedFile({ sourcePath: source, recipe, cachePath: cache })
  const second = await renderEditedFile({ sourcePath: source, recipe, cachePath: cache })
  assert.equal(first.cached, false)
  assert.equal(second.cached, true)
  assert.equal(statSync(source).mtimeMs, before.mtimeMs)
  assert.equal(statSync(source).size, before.size)
  rmSync(dir, { recursive: true, force: true })
})
