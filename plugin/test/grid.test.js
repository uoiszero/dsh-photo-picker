import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { packCells, renderGrid } from '../src/host/grid.js'
import { renderPhotoForModel } from '../src/host/model-image.js'

function photo(index, groupId = null, takenAt = index * 1000) {
  return {
    id: `p${index}`,
    rel_path: `photo-${String(index).padStart(2, '0')}.jpg`,
    group_id: groupId,
    taken_at: takenAt,
  }
}

async function solidJpeg(width, height, color) {
  return sharp({ create: { width, height, channels: 3, background: color } }).jpeg().toBuffer()
}

test('packCells keeps groups contiguous and splits oversized groups', () => {
  const photos = []
  for (let i = 0; i < 3; i++) photos.push(photo(i, 'g1', 100 + i))
  for (let i = 3; i < 40; i++) photos.push(photo(i))
  const packed = packCells(photos, { cols: 4, rows: 4 })
  assert.equal(packed.length, 3)
  assert.equal(packed[0].photos.length, 16)
  assert.equal(packed[2].photos.length, 8)
  const firstCellGroup = packed[0].photos.filter(item => item.group_id === 'g1')
  assert.equal(firstCellGroup.length, 3)

  const big = []
  for (let i = 0; i < 20; i++) big.push(photo(i, 'g2', 1000 + i))
  const bigPacked = packCells(big, { cols: 4, rows: 4 })
  assert.equal(bigPacked.length, 2)
  assert.equal(bigPacked[0].photos.length, 16)
})

test('renderGrid writes a 1280x960 JPEG with a row-major cell map and caches it', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'pp-grid-'))
  const photos = [photo(0), photo(1), photo(2), photo(3), photo(4)]
  const thumbs = new Map(photos.map((item, index) => [item.id, solidJpeg(384, 256, ['#334455', '#775533', '#335577', '#557733', '#553377'][index])]))
  const thumbFor = async item => thumbs.get(item.id)

  const first = await renderGrid({ photos, thumbFor, workspaceDir: dir })
  const meta = await sharp(first.path).metadata()
  assert.equal(meta.width, 1280)
  assert.equal(meta.height, 960)
  assert.deepEqual(Object.keys(first.cellMap), ['A1', 'B1', 'C1', 'D1', 'A2'])
  assert.equal(first.cellMap.A1, 'p0')
  assert.equal(first.cached, false)

  const second = await renderGrid({ photos, thumbFor, workspaceDir: dir })
  assert.equal(second.path, first.path)
  assert.equal(second.cached, true)
  assert.equal(second.cellMap.A2, 'p4')

  rmSync(dir, { recursive: true, force: true })
})

test('renderPhotoForModel caps the long edge at 1300px', async () => {
  const source = await solidJpeg(2000, 1500, '#446688')
  const rendered = await renderPhotoForModel(source)
  assert.equal(rendered.mediaType, 'image/jpeg')
  const meta = await sharp(rendered.data).metadata()
  assert.ok(meta.width <= 1300 && meta.height <= 1300)
  assert.equal(meta.width, 1300)
})
