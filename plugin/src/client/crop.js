/** 归一化裁剪几何：坐标始终相对于全画幅（旋转/去黑角后）。 */

export const CROP_RATIOS = [
  { id: 'free', value: null },
  { id: 'original', value: null },
  { id: '4:3', value: 4 / 3 },
  { id: '5:4', value: 5 / 4 },
  { id: '1:1', value: 1 },
  { id: '16:9', value: 16 / 9 },
  { id: '16:10', value: 16 / 10 },
  { id: '3:2', value: 3 / 2 },
]

const MIN_SIZE = 0.05

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function normalizeSize(crop) {
  const width = clamp(Number(crop.width) || 0, MIN_SIZE, 1)
  const height = clamp(Number(crop.height) || 0, MIN_SIZE, 1)
  const left = clamp(Number(crop.left) || 0, 0, 1 - width)
  const top = clamp(Number(crop.top) || 0, 0, 1 - height)
  return { left, top, width, height }
}

export function normalizeCrop(crop) {
  return normalizeSize(crop ?? { left: 0, top: 0, width: 1, height: 1 })
}


/** EXIF orientation 可能是数字，也可能是 exifr 的 "Rotate 270 CW" 文案。 */
export function isRotatedOrientation(orientation) {
  if (typeof orientation === 'number') return orientation >= 5 && orientation <= 8
  if (typeof orientation === 'string') return /rotate\s*(90|270)(?!\d)/i.test(orientation)
  return false
}

/** 原图尺寸在 EXIF 旋转后得到的显示宽高比。 */
export function frameAspectOf(width, height, orientation) {
  if (!(width > 0) || !(height > 0)) return 1
  return isRotatedOrientation(orientation) ? height / width : width / height
}

/** 把长:短比例按画面横竖转成实际像素宽高比。 */
export function orientedAspect(longShort, frameAspect, swapped = false) {
  let aspect = frameAspect >= 1 ? longShort : 1 / longShort
  if (swapped) aspect = 1 / aspect
  return aspect
}

/** 以当前 crop 中心为中心，取指定像素宽高比的最大可用矩形。 */
export function fitAspect(crop, frameAspect, aspect) {
  const current = normalizeCrop(crop)
  if (aspect === null || aspect === undefined || !(aspect > 0) || !(frameAspect > 0)) return current
  const centerX = current.left + current.width / 2
  const centerY = current.top + current.height / 2
  const ratio = aspect / frameAspect // 归一化 width / height
  let width = Math.min(2 * Math.min(centerX, 1 - centerX), 2 * Math.min(centerY, 1 - centerY) * ratio)
  let height = width / ratio
  if (width < MIN_SIZE) {
    width = MIN_SIZE
    height = width / ratio
  }
  if (height < MIN_SIZE) {
    height = MIN_SIZE
    width = height * ratio
  }
  if (width > 1) {
    width = 1
    height = width / ratio
  }
  if (height > 1) {
    height = 1
    width = height * ratio
  }
  return normalizeCrop({
    left: centerX - width / 2,
    top: centerY - height / 2,
    width,
    height,
  })
}

export function moveCrop(crop, dx, dy) {
  const current = normalizeCrop(crop)
  return normalizeCrop({
    ...current,
    left: current.left + dx,
    top: current.top + dy,
  })
}

function fitLocked(crop, handle, dx, dy, frameAspect, aspect) {
  const current = normalizeCrop(crop)
  const ratio = aspect / frameAspect
  const west = handle.includes('w')
  const east = handle.includes('e')
  const north = handle.includes('n')
  const south = handle.includes('s')
  const centerX = current.left + current.width / 2
  const centerY = current.top + current.height / 2
  const minHeight = Math.max(MIN_SIZE, MIN_SIZE / ratio)
  const minWidth = minHeight * ratio

  if ((west || east) && (north || south)) {
    // 角点：锚定对角，按宽高比取最大可放入画面的尺寸。
    const maxWidth = east ? 1 - current.left : current.left + current.width
    const maxHeight = south ? 1 - current.top : current.top + current.height
    let width = clamp(current.width + (east ? dx : -dx), minWidth, Math.min(maxWidth, maxHeight * ratio))
    let height = width / ratio
    if (height > maxHeight) { height = maxHeight; width = height * ratio }
    if (width > maxWidth) { width = maxWidth; height = width / ratio }
    const left = east ? current.left : current.left + current.width - width
    const top = south ? current.top : current.top + current.height - height
    return normalizeCrop({ left, top, width, height })
  }

  if (west || east) {
    // 左右边：以当前垂直中心为锚，宽度受上下边界约束。
    const maxWidth = east ? 1 - current.left : current.left + current.width
    const maxByCenter = 2 * Math.min(centerY, 1 - centerY) * ratio
    const width = clamp(current.width + (east ? dx : -dx), minWidth, Math.min(maxWidth, maxByCenter))
    const height = width / ratio
    return normalizeCrop({
      left: east ? current.left : current.left + current.width - width,
      top: centerY - height / 2,
      width,
      height,
    })
  }

  // 上下边：以当前水平中心为锚，高度受左右边界约束。
  const maxHeight = south ? 1 - current.top : current.top + current.height
  const maxByCenter = (2 * Math.min(centerX, 1 - centerX)) / ratio
  const height = clamp(current.height + (south ? dy : -dy), minHeight, Math.min(maxHeight, maxByCenter))
  const width = height * ratio
  return normalizeCrop({
    left: centerX - width / 2,
    top: south ? current.top : current.top + current.height - height,
    width,
    height,
  })
}

/** 拖动把手；handle 为 move / n / s / e / w / ne / nw / se / sw。 */
export function resizeCrop(crop, handle, dx, dy, frameAspect, aspect) {
  if (handle === 'move') return moveCrop(crop, dx, dy)
  if (aspect !== null && aspect !== undefined && aspect > 0 && frameAspect > 0) {
    return fitLocked(crop, handle, dx, dy, frameAspect, aspect)
  }
  const current = normalizeCrop(crop)
  let left = current.left
  let top = current.top
  let right = current.left + current.width
  let bottom = current.top + current.height
  if (handle.includes('w')) left = clamp(left + dx, 0, right - MIN_SIZE)
  if (handle.includes('e')) right = clamp(right + dx, left + MIN_SIZE, 1)
  if (handle.includes('n')) top = clamp(top + dy, 0, bottom - MIN_SIZE)
  if (handle.includes('s')) bottom = clamp(bottom + dy, top + MIN_SIZE, 1)
  return normalizeCrop({ left, top, width: right - left, height: bottom - top })
}

export function cropToPixels(crop, width, height) {
  const n = normalizeCrop(crop)
  return {
    left: Math.round(n.left * width),
    top: Math.round(n.top * height),
    width: Math.max(1, Math.round(n.width * width)),
    height: Math.max(1, Math.round(n.height * height)),
  }
}
