/** 图墙固定方形 tile 的行窗口计算；不依赖 DOM，便于 node:test。 */
export const TILE_GAP = 10
export const TILE_MIN = 158
export const TILE_MIN_NARROW = 128

export function computeColumns(width, minTile = TILE_MIN, gap = TILE_GAP) {
  const available = Number(width)
  if (!Number.isFinite(available) || available <= 0) return 1
  return Math.max(1, Math.floor((available + gap) / (minTile + gap)))
}

export function computeRowHeight(width, columns, gap = TILE_GAP) {
  if (!Number.isFinite(width) || width <= 0 || columns <= 0) return 0
  const tileWidth = (width - gap * (columns - 1)) / columns
  return Math.max(0, tileWidth + gap)
}

export function computeVisibleRows({
  scrollTop, wallTop, rowHeight, totalRows, viewportHeight, overscan = 2,
}) {
  if (!Number.isFinite(rowHeight) || rowHeight <= 0 || totalRows <= 0) {
    return { start: 0, end: 0 }
  }
  const first = Math.floor((Number(scrollTop) - Number(wallTop)) / rowHeight)
  const visible = Math.ceil(Math.max(0, Number(viewportHeight)) / rowHeight)
  const start = Math.min(totalRows, Math.max(0, first - overscan))
  const end = Math.min(totalRows, Math.max(0, first) + visible + overscan)
  return { start, end: Math.max(start, end) }
}
