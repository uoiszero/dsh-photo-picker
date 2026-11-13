import { createHash } from 'node:crypto'

export const RECIPE_VERSION = 1
export const RECIPE_ENGINE = 'sharp-v2'
export const MIN_CROP_TRIM = 0.18

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const number = value => (typeof value === 'number' && Number.isFinite(value) ? value : undefined)
const round4 = value => Math.round(value * 10_000) / 10_000
const read = (object, ...keys) => {
  if (object === null || typeof object !== 'object') return undefined
  for (const key of keys) {
    if (object[key] !== undefined) return object[key]
  }
  return undefined
}

export function isIdentityRecipe(recipe) {
  if (recipe === null || recipe === undefined) return true
  const crop = recipe.crop ?? { left: 0, top: 0, width: 1, height: 1 }
  return Math.abs(crop.left) < 1e-6
    && Math.abs(crop.top) < 1e-6
    && Math.abs(crop.width - 1) < 1e-6
    && Math.abs(crop.height - 1) < 1e-6
    && Math.abs(recipe.rotate ?? 0) < 1e-6
    && Math.abs(recipe.exposureEv ?? 0) < 1e-6
    && Math.abs(recipe.contrast ?? 0) < 1e-6
    && Math.abs(recipe.saturation ?? 0) < 1e-6
    && Math.abs(recipe.sharpen ?? 0) < 1e-6
}

function trimEdges(crop) {
  return [
    { edge: 'left', amount: crop.left },
    { edge: 'right', amount: Math.max(0, 1 - crop.left - crop.width) },
    { edge: 'top', amount: crop.top },
    { edge: 'bottom', amount: Math.max(0, 1 - crop.top - crop.height) },
  ].filter(item => item.amount > 1e-6)
}

/** 模型常给出 8–12% 的“安全微裁”；所有被裁边都小于阈值时，整条裁切没有构图意义。 */
export function isMicroCrop(crop) {
  const edges = trimEdges(crop)
  return edges.length > 0 && edges.every(item => item.amount < MIN_CROP_TRIM)
}

/** 缺失/恒等/坏数据返回 null；合法配方返回规范化对象。 */
export function normalizeRecipe(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return null
  const version = number(input.version) ?? RECIPE_VERSION
  if (version !== RECIPE_VERSION) return null

  const cropRaw = read(input, 'crop', '裁剪') ?? {}
  const left = clamp(number(read(cropRaw, 'left', 'x', '左')) ?? 0, 0, 0.95)
  const top = clamp(number(read(cropRaw, 'top', 'y', '上')) ?? 0, 0, 0.95)
  const width = clamp(number(read(cropRaw, 'width', 'w', '宽')) ?? 1, 0.05, 1 - left)
  const height = clamp(number(read(cropRaw, 'height', 'h', '高')) ?? 1, 0.05, 1 - top)
  const crop = {
    left: round4(left),
    top: round4(top),
    width: round4(width),
    height: round4(height),
  }

  const recipe = {
    version: RECIPE_VERSION,
    crop,
    rotate: round4(clamp(number(read(input, 'rotate', '旋转')) ?? 0, -5, 5)),
    exposureEv: round4(clamp(number(read(input, 'exposureEv', 'exposure', '曝光')) ?? 0, -2, 2)),
    contrast: round4(clamp(number(read(input, 'contrast', '对比度')) ?? 0, -1, 1)),
    saturation: round4(clamp(number(read(input, 'saturation', '饱和度')) ?? 0, -1, 1)),
    sharpen: round4(clamp(number(read(input, 'sharpen', 'sharpening', '锐化')) ?? 0, 0, 2)),
  }
  if (isMicroCrop(recipe.crop)) {
    recipe.crop = { left: 0, top: 0, width: 1, height: 1 }
  }
  return isIdentityRecipe(recipe) ? null : recipe
}

/** 裁剪坐标按“旋转并自动裁掉黑角后的画布”归一化。 */

/** 旋转后画面内最大的轴对齐矩形，用来裁掉旋转产生的黑角。 */
export function maxInscribedRect(width, height, angleDegrees) {
  if (!(width > 0) || !(height > 0)) return { width: 1, height: 1 }
  const rad = Math.abs(angleDegrees) * Math.PI / 180
  if (rad < 1e-9) return { width, height }

  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  const widthIsLonger = width >= height
  const longSide = widthIsLonger ? width : height
  const shortSide = widthIsLonger ? height : width

  let rectLong
  let rectShort
  if (shortSide <= 2 * sin * cos * longSide) {
    rectLong = shortSide / (2 * sin)
    rectShort = shortSide / (2 * cos)
  } else {
    const denominator = cos * cos - sin * sin
    rectLong = (longSide * cos - shortSide * sin) / denominator
    rectShort = (shortSide * cos - longSide * sin) / denominator
  }

  const rectWidth = widthIsLonger ? rectLong : rectShort
  const rectHeight = widthIsLonger ? rectShort : rectLong
  return {
    width: Math.max(1, Math.min(width, Math.floor(rectWidth))),
    height: Math.max(1, Math.min(height, Math.floor(rectHeight))),
  }
}

export function cropPixels(recipe, width, height) {
  const crop = recipe?.crop ?? { left: 0, top: 0, width: 1, height: 1 }
  const left = Math.min(width - 1, Math.max(0, Math.round(crop.left * width)))
  const top = Math.min(height - 1, Math.max(0, Math.round(crop.top * height)))
  return {
    left,
    top,
    width: Math.max(1, Math.min(width - left, Math.round(crop.width * width))),
    height: Math.max(1, Math.min(height - top, Math.round(crop.height * height))),
  }
}

export function recipeSignature(recipe) {
  const canonical = JSON.stringify([
    RECIPE_ENGINE,
    recipe.version,
    recipe.crop.left, recipe.crop.top, recipe.crop.width, recipe.crop.height,
    recipe.rotate, recipe.exposureEv, recipe.contrast, recipe.saturation, recipe.sharpen,
  ])
  return createHash('sha256').update(canonical).digest('hex').slice(0, 12)
}
