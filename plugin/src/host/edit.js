import { access, mkdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import sharp from 'sharp'
import { decodeToJpeg } from './images.js'
import { RECIPE_ENGINE, cropPixels, maxInscribedRect } from './recipe.js'
import { curveLut, isIdentityCurve, isIdentityCurves } from '../shared/curves.js'

export { RECIPE_ENGINE as EDIT_ENGINE }

async function applyCurveLuts(image, curves) {
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  const channels = info.channels
  const master = curveLut(curves.master)
  const red = curveLut(curves.r)
  const green = curveLut(curves.g)
  const blue = curveLut(curves.b)
  const luma = curveLut(curves.luma)
  const useMaster = !isIdentityCurve(curves.master)
  const useRed = !isIdentityCurve(curves.r)
  const useGreen = !isIdentityCurve(curves.g)
  const useBlue = !isIdentityCurve(curves.b)
  const useLuma = !isIdentityCurve(curves.luma)

  for (let index = 0; index < data.length; index += channels) {
    if (channels === 1 || channels === 2) {
      let value = data[index]
      if (useMaster) value = master[value]
      if (useLuma) value = luma[value]
      data[index] = value
      continue
    }
    let r = data[index]
    let g = data[index + 1]
    let b = data[index + 2]
    if (useMaster) {
      r = master[r]
      g = master[g]
      b = master[b]
    }
    if (useRed) r = red[r]
    if (useGreen) g = green[g]
    if (useBlue) b = blue[b]
    if (useLuma) {
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
      const mapped = luma[Math.max(0, Math.min(255, Math.round(luminance)))]
      if (luminance < 0.5) {
        r = mapped
        g = mapped
        b = mapped
      } else {
        const scale = mapped / luminance
        r = Math.max(0, Math.min(255, Math.round(r * scale)))
        g = Math.max(0, Math.min(255, Math.round(g * scale)))
        b = Math.max(0, Math.min(255, Math.round(b * scale)))
      }
    }
    data[index] = r
    data[index + 1] = g
    data[index + 2] = b
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels },
  })
}

async function readableInput(sourcePath) {
  try {
    await sharp(sourcePath).metadata()
    return sourcePath
  } catch {
    // HEIC/RAW 等 sharp 读不了的格式，交给平台层转成 1200px JPEG。
    return decodeToJpeg(sourcePath)
  }
}

export async function renderEditedBuffer({ sourcePath, recipe, maxWidth = null }) {
  if (recipe === null || recipe === undefined) {
    const error = new Error('edit recipe is required')
    error.code = 'BAD_RECIPE'
    throw error
  }

  const input = await readableInput(sourcePath)
  let rotated = sharp(input).autoOrient()
  if (Math.abs(recipe.rotate) > 1e-6) {
    rotated = rotated.rotate(recipe.rotate, { background: { r: 0, g: 0, b: 0, alpha: 1 } })
  }
  const metadata = await sharp(input).metadata()
  const orientation = metadata.orientation ?? 1
  const sourceWidth = orientation >= 5 && orientation <= 8 ? metadata.height : metadata.width
  const sourceHeight = orientation >= 5 && orientation <= 8 ? metadata.width : metadata.height
  const stage = await rotated.toBuffer({ resolveWithObject: true })
  // 旋转会留下黑角；按原始尺寸计算最大内接矩形，再在旋转后的画布上居中裁剪。
  const inner = maxInscribedRect(sourceWidth, sourceHeight, recipe.rotate)
  const innerCrop = {
    left: Math.floor((stage.info.width - inner.width) / 2),
    top: Math.floor((stage.info.height - inner.height) / 2),
    width: inner.width,
    height: inner.height,
  }
  const straightened = innerCrop.width === stage.info.width && innerCrop.height === stage.info.height
    ? stage.data
    : await sharp(stage.data).extract(innerCrop).toBuffer()
  const crop = cropPixels(recipe, innerCrop.width, innerCrop.height)

  let output = sharp(straightened).extract(crop)
  if (Math.abs(recipe.exposureEv) > 1e-6) {
    output = output.linear(2 ** recipe.exposureEv, 0)
  }
  if (Math.abs(recipe.contrast) > 1e-6) {
    output = output.linear(1 + recipe.contrast, -128 * recipe.contrast)
  }
  if (Math.abs(recipe.saturation) > 1e-6) {
    output = output.modulate({ saturation: Math.max(0, 1 + recipe.saturation) })
  }

  const hasCurves = !isIdentityCurves(recipe.curves)
  if (hasCurves && maxWidth !== null && maxWidth > 0) {
    output = output.resize({ width: maxWidth, withoutEnlargement: true })
  }
  if (hasCurves) output = await applyCurveLuts(output, recipe.curves)
  if (recipe.sharpen > 0.01) {
    output = output.sharpen({ sigma: 0.5 + recipe.sharpen })
  }
  if (!hasCurves && maxWidth !== null && maxWidth > 0) {
    output = output.resize({ width: maxWidth, withoutEnlargement: true })
  }
  return output.jpeg({ quality: 92 }).toBuffer()
}

export async function renderEditedFile({ sourcePath, recipe, cachePath }) {
  try {
    await access(cachePath)
    return { path: cachePath, cached: true }
  } catch {
    // cache miss
  }
  const buffer = await renderEditedBuffer({ sourcePath, recipe })
  await mkdir(path.dirname(cachePath), { recursive: true })
  const temporary = `${cachePath}.${process.pid}.${nanoid(6)}.tmp`
  try {
    await writeFile(temporary, buffer)
    await rename(temporary, cachePath)
  } finally {
    await rm(temporary, { force: true })
  }
  return { path: cachePath, cached: false }
}
