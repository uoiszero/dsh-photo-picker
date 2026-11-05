import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { platform } from './platform.js'

const THUMB_EDGE = 384
const METRIC_EDGE = 800
const DECODE_EDGE = 1200
const PREVIEW_EDGE = 1600

/**
 * 解码到长边 1200 的 JPEG 缓冲；HEIC/RAW 等 sharp 读不了的格式
 * 交给平台层（macOS sips / Windows WIC）转成临时 JPEG。
 */
export async function decodeToJpeg(filePath) {
  try {
    return await sharp(filePath)
      .rotate()
      .resize({ width: DECODE_EDGE, height: DECODE_EDGE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 92 })
      .toBuffer()
  } catch (error) {
    const converted = await platform.decodeToJpeg(filePath)
    try {
      return await sharp(converted.path)
        .rotate()
        .resize({ width: DECODE_EDGE, height: DECODE_EDGE, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 92 })
        .toBuffer()
    } finally {
      await converted.cleanup()
    }
  }
}

/** 64 位 dHash，十六进制字符串。 */
export function dhashFromGray(gray, width, height) {
  let bits = 0n
  let index = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const left = gray[y * width + x]
      const right = gray[y * width + x + 1]
      if (left > right) bits |= 1n << BigInt(index)
      index += 1
    }
  }
  return bits.toString(16).padStart(16, '0')
}

/** 两个十六进制 dHash 的汉明距离。 */
export function hammingHex(a, b) {
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`)
  let count = 0
  while (x > 0n) {
    count += Number(x & 1n)
    x >>= 1n
  }
  return count
}

function laplacianVariance(gray, width, height) {
  if (width < 3 || height < 3) return 0
  let sum = 0
  let sumSq = 0
  let n = 0
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const center = gray[y * width + x]
      const value = 4 * center
        - gray[(y - 1) * width + x] - gray[(y + 1) * width + x]
        - gray[y * width + x - 1] - gray[y * width + x + 1]
      sum += value
      sumSq += value * value
      n += 1
    }
  }
  if (n === 0) return 0
  const mean = sum / n
  return sumSq / n - mean * mean
}

/** 原始像素尺寸（含 EXIF 旋转）；sharp 读不到时回退平台解码器。 */
async function originalSize(filePath) {
  try {
    const meta = await sharp(filePath).metadata()
    if (meta.width !== undefined && meta.height !== undefined) {
      const rotated = typeof meta.orientation === 'number' && meta.orientation >= 5 && meta.orientation <= 8
      return {
        width: rotated ? meta.height : meta.width,
        height: rotated ? meta.width : meta.height,
      }
    }
  } catch {
    // HEIC/RAW 可能不在 sharp 的 loader 里，回退平台解码器。
  }
  return platform.imageSize(filePath)
}

/** 从一张原图派生缩略图、尺寸、模糊分数、曝光裁剪比例与 dHash。 */
export async function deriveImage(filePath) {
  const size = await originalSize(filePath)
  const jpeg = await decodeToJpeg(filePath)

  const thumb = await sharp(jpeg)
    .resize({ width: THUMB_EDGE, height: THUMB_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer()

  const metric = await sharp(jpeg)
    .resize({ width: METRIC_EDGE, height: METRIC_EDGE, fit: 'inside', withoutEnlargement: true })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const gray = metric.data
  const { width, height } = metric.info
  let low = 0
  let high = 0
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] <= 5) low += 1
    else if (gray[i] >= 250) high += 1
  }

  const dhashGray = await sharp(jpeg)
    .resize(9, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer()

  return {
    thumb,
    width: size.width,
    height: size.height,
    blurScore: laplacianVariance(gray, width, height),
    clipLow: low / gray.length,
    clipHigh: high / gray.length,
    dhash: dhashFromGray(dhashGray, 9, 8),
  }
}

/** 单图/组对比用的 1600px 预览；已有缓存直接命中。 */
export async function renderPreview(filePath, cachePath) {
  try {
    await access(cachePath)
    return { path: cachePath, cached: true }
  } catch {
    // 未命中
  }
  await mkdir(path.dirname(cachePath), { recursive: true })
  const encode = buffer => sharp(buffer)
    .rotate()
    .resize({ width: PREVIEW_EDGE, height: PREVIEW_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()
  let buffer
  try {
    buffer = await encode(filePath)
  } catch {
    const converted = await platform.decodeToJpeg(filePath)
    try {
      buffer = await encode(converted.path)
    } finally {
      await converted.cleanup()
    }
  }
  await writeFile(cachePath, buffer)
  return { path: cachePath, cached: false }
}
