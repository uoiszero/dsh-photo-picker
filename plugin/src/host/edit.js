import { access, mkdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import sharp from 'sharp'
import { decodeToJpeg } from './images.js'
import { RECIPE_ENGINE, cropPixels } from './recipe.js'

export { RECIPE_ENGINE as EDIT_ENGINE }

async function readableInput(sourcePath) {
  try {
    await sharp(sourcePath).metadata()
    return sourcePath
  } catch {
    // HEIC/RAW 等 sharp 读不了的格式，交给平台层转成 1200px JPEG。
    return decodeToJpeg(sourcePath)
  }
}

export async function renderEditedBuffer({ sourcePath, recipe }) {
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
  const stage = await rotated.toBuffer({ resolveWithObject: true })
  const crop = cropPixels(recipe, stage.info.width, stage.info.height)

  let output = sharp(stage.data).extract(crop)
  if (Math.abs(recipe.exposureEv) > 1e-6) {
    output = output.linear(2 ** recipe.exposureEv, 0)
  }
  if (Math.abs(recipe.contrast) > 1e-6) {
    output = output.linear(1 + recipe.contrast, -128 * recipe.contrast)
  }
  if (Math.abs(recipe.saturation) > 1e-6) {
    output = output.modulate({ saturation: Math.max(0, 1 + recipe.saturation) })
  }
  if (recipe.sharpen > 0.01) {
    output = output.sharpen({ sigma: 0.5 + recipe.sharpen })
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
