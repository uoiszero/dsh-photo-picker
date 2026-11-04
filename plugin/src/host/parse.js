/** 后期建议固定代码（spec 18.3）；带参数的四类另有正则校验。 */
export const POST_PROCESSING_CODES = new Set([
  'crop_left', 'crop_right', 'crop_top', 'crop_bottom',
  'white_balance', 'warm', 'cool', 'shadow_lift', 'highlight_recover', 'denoise', 'sharpen',
])

const PARAMETERIZED_CODE = /^(straighten|exposure|contrast|saturation)_[+-]\d+(\.\d+)?$/

export function isPostProcessingCode(code) {
  return POST_PROCESSING_CODES.has(code) || PARAMETERIZED_CODE.test(code)
}

export const DIMENSION_KEYS = ['composition', 'light', 'color', 'technique', 'post_potential', 'moment']
const VERDICTS = new Set(['keep', 'maybe', 'reject'])

export class BadModelJson extends Error {
  constructor(message) {
    super(message)
    this.name = 'BadModelJson'
    this.code = 'BAD_MODEL_JSON'
  }
}

/** 去掉 markdown 围栏，截取第一个括号配对的 JSON 片段。 */
export function extractJson(text) {
  const cleaned = String(text ?? '').replace(/```(?:json)?/gi, '').trim()
  const start = cleaned.search(/[[{]/)
  if (start === -1) return undefined
  const open = cleaned[start]
  const close = open === '[' ? ']' : '}'
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < cleaned.length; i++) {
    const char = cleaned[i]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') { inString = true; continue }
    if (char === open) depth += 1
    else if (char === close) {
      depth -= 1
      if (depth === 0) return cleaned.slice(start, i + 1)
    }
  }
  return undefined
}

export function normalizeReason(text, max = 120) {
  return String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

/** 粗筛结果：优先 JSON 数组，失败用编号正则兜底；越界/重复编号丢弃。 */
export function parseGridSelection(text, validCodes) {
  const valid = new Set(validCodes.map(code => code.toUpperCase()))
  const json = extractJson(text)
  if (json !== undefined) {
    try {
      const value = JSON.parse(json)
      if (Array.isArray(value)) {
        const codes = [...new Set(value
          .filter(item => typeof item === 'string')
          .map(item => item.trim().toUpperCase())
          .filter(code => valid.has(code)))]
        if (codes.length > 0) return { codes, parsed: true }
      }
    } catch {
      // 交给正则兜底
    }
  }
  const matches = String(text ?? '').toUpperCase().match(/[A-D][1-4]/g) ?? []
  const codes = [...new Set(matches.filter(code => valid.has(code)))]
  return { codes, parsed: codes.length > 0 }
}

/** 组内排序结果：order 只保留给定标签，best 必须存在。 */
export function parseRank(text, labels) {
  const json = extractJson(text)
  if (json === undefined) throw new BadModelJson('rank: no JSON object')
  let value
  try {
    value = JSON.parse(json)
  } catch {
    throw new BadModelJson('rank: invalid JSON')
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadModelJson('rank: expected an object')
  }
  const allowed = new Set(labels)
  const order = [...new Set(Array.isArray(value.order)
    ? value.order.filter(label => typeof label === 'string' && allowed.has(label))
    : [])]
  const best = typeof value.best === 'string' ? value.best : undefined
  if (best === undefined || !allowed.has(best)) throw new BadModelJson('rank: best is not one of the given labels')
  if (!order.includes(best)) order.unshift(best)
  return { order, best, reason: normalizeReason(value.reason, 200) }
}

/** 单张精评结果：分数夹到 0–10，六维缺失补 null，后期建议过滤白名单。 */
export function parseScore(text) {
  const json = extractJson(text)
  if (json === undefined) throw new BadModelJson('score: no JSON object')
  let value
  try {
    value = JSON.parse(json)
  } catch {
    throw new BadModelJson('score: invalid JSON')
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadModelJson('score: expected an object')
  }
  const score = Number(value.score)
  if (!Number.isFinite(score)) throw new BadModelJson('score: missing numeric score')
  if (typeof value.verdict !== 'string' || !VERDICTS.has(value.verdict)) {
    throw new BadModelJson('score: missing or invalid verdict')
  }
  const dimensions = {}
  for (const key of DIMENSION_KEYS) {
    const dimension = value.dimensions?.[key]
    dimensions[key] = typeof dimension === 'number' && Number.isFinite(dimension) ? dimension : null
  }
  const postProcessing = Array.isArray(value.post_processing)
    ? [...new Set(value.post_processing.filter(code => typeof code === 'string' && isPostProcessingCode(code)))]
    : []
  return {
    score: Math.min(10, Math.max(0, Math.round(score * 10) / 10)),
    verdict: value.verdict,
    dimensions,
    postProcessing,
    reason: normalizeReason(value.reason, 120),
  }
}
