import sharp from 'sharp'
import { normalizeCurve, normalizeCurves } from '../shared/curves.js'
import { decodeToJpeg } from './images.js'

export const MAX_STYLE_SAMPLES = 5
const SAMPLE_EDGE = 256
const CONTACT_CELL_WIDTH = 400
const CONTACT_CELL_HEIGHT = 300
const CONTACT_COLUMNS = 3
const CONTACT_ROWS = 2
const ANALYSIS_POINTS = [0, 0.125, 0.25, 0.5, 0.75, 0.875, 1]

export const STYLE_SYSTEM = `You are a careful photo colorist. Analyze the supplied contact sheet of reference photos and describe their shared global look. Return only one JSON object, no markdown. Do not describe subjects, locations, or composition. The look must be reproducible with global tone curves and saturation only.`

export const styleUserPrompt = `Return JSON with this exact shape:
{
  "name": "short style name",
  "description": "one or two sentences about tone and color",
  "tone": {
    "contrast": -0.5..0.5,
    "shadows": -0.5..0.5,
    "highlights": -0.5..0.5,
    "warmth": -0.5..0.5,
    "saturation": -0.5..0.5
  },
  "tags": ["film", "warm"],
  "confidence": 0..1
}
Use 0 for a neutral value. Keep the look plausible for ordinary photos; no extreme color casts.`

function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}

function clampSigned(value, fallback = 0, limit = 0.5) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(limit, Math.max(-limit, value))
    : fallback
}

async function sampleHistograms(filePath) {
  const decoded = await decodeToJpeg(filePath)
  const { data, info } = await sharp(decoded)
    .resize({ width: SAMPLE_EDGE, height: SAMPLE_EDGE, fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const hist = {
    master: new Float64Array(256),
    r: new Float64Array(256),
    g: new Float64Array(256),
    b: new Float64Array(256),
  }
  const channels = info.channels
  for (let index = 0; index < data.length; index += channels) {
    const r = data[index]
    const g = data[index + 1] ?? r
    const b = data[index + 2] ?? r
    const luma = Math.max(0, Math.min(255, Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)))
    hist.master[luma] += 1
    hist.r[r] += 1
    hist.g[g] += 1
    hist.b[b] += 1
  }
  return { hist, pixels: data.length / channels }
}

function quantile(hist, total, p) {
  if (total <= 0) return p
  const target = Math.max(0, Math.min(total - 1, p * (total - 1)))
  let seen = 0
  for (let index = 0; index < hist.length; index++) {
    seen += hist[index]
    if (seen > target) return index / (hist.length - 1)
  }
  return 1
}

function curveFromQuantiles(hist, total, { relative = null, strength = 0.65 } = {}) {
  const points = []
  for (const p of ANALYSIS_POINTS) {
    const q = quantile(hist, total, p)
    const base = relative === null ? p : quantile(relative, total, p)
    const y = p + (q - base) * strength
    points.push([p, clamp01(y)])
  }
  return normalizeCurve(points)
}

/**
 * 从样片提取全局亮度曲线和相对通道色彩曲线。纯统计，不调用模型。
 * @param {string[]} samplePaths
 */
export async function analyzeStyleSamples(samplePaths) {
  if (!Array.isArray(samplePaths) || samplePaths.length === 0) {
    const error = new Error('style extraction needs at least one sample')
    error.code = 'BAD_STYLE_SAMPLE'
    error.statusCode = 400
    throw error
  }
  if (samplePaths.length > MAX_STYLE_SAMPLES) {
    const error = new Error(`style extraction accepts at most ${MAX_STYLE_SAMPLES} samples`)
    error.code = 'BAD_STYLE_SAMPLE'
    error.statusCode = 400
    throw error
  }

  const total = {
    master: new Float64Array(256),
    r: new Float64Array(256),
    g: new Float64Array(256),
    b: new Float64Array(256),
  }
  let pixels = 0
  for (const filePath of samplePaths) {
    const sample = await sampleHistograms(filePath)
    for (const key of Object.keys(total)) {
      for (let index = 0; index < 256; index++) total[key][index] += sample.hist[key][index]
    }
    pixels += sample.pixels
  }

  return {
    sampleCount: samplePaths.length,
    curves: normalizeCurves({
      master: curveFromQuantiles(total.master, pixels),
      r: curveFromQuantiles(total.r, pixels, { relative: total.master, strength: 0.45 }),
      g: curveFromQuantiles(total.g, pixels, { relative: total.master, strength: 0.45 }),
      b: curveFromQuantiles(total.b, pixels, { relative: total.master, strength: 0.45 }),
    }),
    saturation: 0,
  }
}

/**
 * 把模型的语义参数叠加到本地曲线上。保持端点固定，并做保守 clamp。
 * @param {{master: any, r: any, g: any, b: any}} curves
 * @param {{contrast?: number, shadows?: number, highlights?: number, warmth?: number}} tone
 */
export function applyStyleTone(curves, tone = {}) {
  const contrast = clampSigned(tone.contrast)
  const shadows = clampSigned(tone.shadows)
  const highlights = clampSigned(tone.highlights)
  const warmth = clampSigned(tone.warmth)

  const adjust = point => {
    const [x, y] = point
    let value = y
    if (x > 0 && x < 1) {
      value = 0.5 + (value - 0.5) * (1 + contrast * 1.2)
      value += shadows * (1 - x) ** 2 * 0.12
      value += highlights * x ** 2 * 0.12
    }
    return [x, clamp01(value)]
  }
  const tint = (point, amount) => {
    const [x, y] = point
    if (x <= 0 || x >= 1) return [x, y]
    return [x, clamp01(y + amount * 0.12 * Math.sin(Math.PI * x))]
  }

  return normalizeCurves({
    master: normalizeCurve(curves.master.map(adjust)),
    r: normalizeCurve(curves.r.map(point => tint(point, warmth))),
    g: normalizeCurve(curves.g),
    b: normalizeCurve(curves.b.map(point => tint(point, -warmth))),
  })
}

function extractJson(text) {
  if (typeof text !== 'string') return null
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

/** 解析模型返回；非法 JSON 或空结构返回 null。 */
export function parseStyleAnalysis(text) {
  const parsed = extractJson(text)
  if (parsed === null || typeof parsed !== 'object') return null
  const toneInput = parsed.tone && typeof parsed.tone === 'object' ? parsed.tone : {}
  const tone = {
    contrast: clampSigned(toneInput.contrast),
    shadows: clampSigned(toneInput.shadows),
    highlights: clampSigned(toneInput.highlights),
    warmth: clampSigned(toneInput.warmth),
    saturation: clampSigned(toneInput.saturation),
  }
  const name = typeof parsed.name === 'string' ? parsed.name.trim().slice(0, 80) : ''
  const description = typeof parsed.description === 'string' ? parsed.description.trim().slice(0, 500) : ''
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.filter(tag => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean).slice(0, 8)
    : []
  if (name === '' && description === '' && tags.length === 0) return null
  return {
    name,
    description,
    tone,
    tags,
    confidence: typeof parsed.confidence === 'number' && Number.isFinite(parsed.confidence)
      ? Math.min(1, Math.max(0, parsed.confidence))
      : 0,
  }
}

/** 把 1–5 张样片拼成一张 contact sheet，避免逐张发送模型。 */
export async function buildStyleContactSheet(samplePaths) {
  if (!Array.isArray(samplePaths) || samplePaths.length === 0) {
    throw new Error('contact sheet needs at least one sample')
  }
  const width = CONTACT_COLUMNS * CONTACT_CELL_WIDTH
  const height = CONTACT_ROWS * CONTACT_CELL_HEIGHT
  const composites = []
  for (let index = 0; index < Math.min(samplePaths.length, MAX_STYLE_SAMPLES); index++) {
    const decoded = await decodeToJpeg(samplePaths[index])
    const cell = await sharp(decoded)
      .resize(CONTACT_CELL_WIDTH, CONTACT_CELL_HEIGHT, { fit: 'cover' })
      .jpeg({ quality: 86 })
      .toBuffer()
    composites.push({
      input: cell,
      left: (index % CONTACT_COLUMNS) * CONTACT_CELL_WIDTH,
      top: Math.floor(index / CONTACT_COLUMNS) * CONTACT_CELL_HEIGHT,
    })
  }
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 128, g: 128, b: 128 },
    },
  })
    .composite(composites)
    .jpeg({ quality: 86 })
    .toBuffer()
}
