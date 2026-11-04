import { createHash } from 'node:crypto'
import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const CELL_WIDTH = 320
const CELL_HEIGHT = 240
const LABEL_STYLE = 'v1'
const ENCODER = 'jpeg-q90-444'
const BACKGROUND = { r: 128, g: 128, b: 128 }

function timeOf(photo) {
  return Number(photo.taken_at ?? photo.mtime_ms ?? 0)
}

/**
 * 分组感知打包：同组成员连续且不跨格；单组超过一格容量时才拆分。
 * @returns {{ seq: number, photos: object[] }[]}
 */
export function packCells(photos, { cols = 4, rows = 4 } = {}) {
  const capacity = cols * rows
  const sorted = [...photos].sort((a, b) => timeOf(a) - timeOf(b)
    || String(a.rel_path ?? '').localeCompare(String(b.rel_path ?? '')))

  const runs = []
  for (const photo of sorted) {
    const groupId = photo.group_id ?? null
    const last = runs[runs.length - 1]
    if (groupId !== null && last !== undefined && last.groupId === groupId) last.items.push(photo)
    else runs.push({ groupId, items: [photo] })
  }

  const cells = []
  let current = []
  for (const run of runs) {
    let index = 0
    while (index < run.items.length) {
      const space = capacity - current.length
      if (run.items.length - index <= space) {
        current.push(...run.items.slice(index))
        index = run.items.length
      } else if (current.length === 0) {
        current.push(...run.items.slice(index, index + capacity))
        index += capacity
      } else {
        cells.push(current)
        current = []
      }
      if (current.length === capacity) {
        cells.push(current)
        current = []
      }
    }
  }
  if (current.length > 0) cells.push(current)
  return cells.map((cell, seq) => ({ seq, photos: cell }))
}

/** 行优先编号：列字母 + 行号，例如 A1、B1、…、D4。 */
export function labelAt(col, row) {
  return `${String.fromCharCode(65 + col)}${row + 1}`
}

function cacheKeyFor(photos, cols, rows, quality) {
  return createHash('sha1').update(JSON.stringify({
    ids: photos.map(photo => photo.id),
    cols, rows, cell: [CELL_WIDTH, CELL_HEIGHT], label: LABEL_STYLE, encoder: ENCODER, quality,
  })).digest('hex').slice(0, 20)
}

function overlaySvg(cols, rows) {
  const width = cols * CELL_WIDTH
  const height = rows * CELL_HEIGHT
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`,
    `<g font-family="-apple-system, Helvetica, Arial, sans-serif" font-size="20" font-weight="700">`,
  ]
  for (let col = 1; col < cols; col++) {
    parts.push(`<line x1="${col * CELL_WIDTH}" y1="0" x2="${col * CELL_WIDTH}" y2="${height}" stroke="#000000" stroke-opacity="0.35" stroke-width="1"/>`)
  }
  for (let row = 1; row < rows; row++) {
    parts.push(`<line x1="0" y1="${row * CELL_HEIGHT}" x2="${width}" y2="${row * CELL_HEIGHT}" stroke="#000000" stroke-opacity="0.35" stroke-width="1"/>`)
  }
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * CELL_WIDTH + 8
      const y = row * CELL_HEIGHT + 26
      parts.push(`<text x="${x}" y="${y}" fill="#ffffff" stroke="#000000" stroke-width="3" paint-order="stroke">${labelAt(col, row)}</text>`)
    }
  }
  parts.push('</g></svg>')
  return parts.join('')
}

/**
 * 渲染一张网格图并缓存：底图 1280×960，每格 contain 不裁切，编号行优先。
 * @param {{ photos: object[], thumbFor: (photo) => Promise<Buffer|undefined>, workspaceDir: string, cols?: number, rows?: number, quality?: number }} input
 * @returns {Promise<{ path: string, cellMap: Record<string, string>, cached: boolean }>}
 */
export async function renderGrid({ photos, thumbFor, workspaceDir, cols = 4, rows = 4, quality = 90 }) {
  const key = cacheKeyFor(photos, cols, rows, quality)
  const dir = path.join(workspaceDir, 'grids')
  const filePath = path.join(dir, `${key}.jpg`)
  const cellMap = {}
  photos.forEach((photo, index) => {
    cellMap[labelAt(index % cols, Math.floor(index / cols))] = photo.id
  })

  try {
    await access(filePath)
    return { path: filePath, cellMap, cached: true }
  } catch {
    // 未命中缓存，继续渲染
  }

  await mkdir(dir, { recursive: true })
  const width = cols * CELL_WIDTH
  const height = rows * CELL_HEIGHT
  const composites = []
  for (let index = 0; index < photos.length; index++) {
    const thumb = await thumbFor(photos[index])
    if (thumb === undefined || thumb === null) continue
    const cell = await sharp(thumb)
      .resize(CELL_WIDTH, CELL_HEIGHT, { fit: 'contain', background: BACKGROUND })
      .toBuffer()
    composites.push({
      input: cell,
      left: (index % cols) * CELL_WIDTH,
      top: Math.floor(index / cols) * CELL_HEIGHT,
    })
  }
  composites.push({ input: Buffer.from(overlaySvg(cols, rows)), left: 0, top: 0 })

  const buffer = await sharp({ create: { width, height, channels: 3, background: BACKGROUND } })
    .composite(composites)
    .jpeg({ quality, chromaSubsampling: '4:4:4' })
    .toBuffer()
  await writeFile(filePath, buffer)
  return { path: filePath, cellMap, cached: false }
}
