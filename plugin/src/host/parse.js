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
const DIMENSION_ALIASES = {
  composition: ['composition', '构图'],
  light: ['light', '光影', '光线'],
  color: ['color', '色彩', '颜色'],
  technique: ['technique', '技术质量', '技术'],
  post_potential: ['post_potential', '后期潜力'],
  moment: ['moment', '瞬间与叙事', '瞬间', '叙事'],
}
const VERDICTS = new Set(['keep', 'maybe', 'reject'])
const VERDICT_ALIASES = new Map([
  ['keep', 'keep'], ['保留', 'keep'], ['留', 'keep'],
  ['maybe', 'maybe'], ['待定', 'maybe'], ['也许', 'maybe'], ['不确定', 'maybe'],
  ['reject', 'reject'], ['淘汰', 'reject'], ['弃', 'reject'], ['拒绝', 'reject'], ['不要', 'reject'],
])

function pickNumber(...values) {
  for (const value of values) {
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return undefined
}

function pickString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') return value
  }
  return undefined
}

/** 兼容模型返回中文键名 / 扁平六维 / 嵌套 dimensions 三种形态。 */
function dimensionValue(source, key) {
  for (const alias of DIMENSION_ALIASES[key]) {
    const value = source?.[alias]
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return null
}

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
  const orderValue = value.order ?? value['排序'] ?? value['顺序']
  const order = [...new Set(Array.isArray(orderValue)
    ? orderValue.filter(label => typeof label === 'string' && allowed.has(label))
    : [])]
  const best = pickString(value.best, value['最佳'], value['最好'], value['第一名'])
  if (best === undefined || !allowed.has(best)) throw new BadModelJson('rank: best is not one of the given labels')
  if (!order.includes(best)) order.unshift(best)
  return { order, best, reason: normalizeReason(pickString(value.reason, value['理由'], value['原因'], value['说明']), 200) }
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
  const score = pickNumber(value.score, value['总分'], value['分数'], value['评分'])
  if (score === undefined) throw new BadModelJson('score: missing numeric score')
  const verdictRaw = pickString(value.verdict, value['建议'], value['判定'], value['结论'])
  const verdict = verdictRaw === undefined ? undefined : VERDICT_ALIASES.get(verdictRaw.trim().toLowerCase()) ?? VERDICT_ALIASES.get(verdictRaw.trim())
  if (verdict === undefined || !VERDICTS.has(verdict)) {
    throw new BadModelJson('score: missing or invalid verdict')
  }
  const dimensionsSource = value.dimensions ?? value['维度'] ?? value['六维'] ?? value
  const dimensions = {}
  for (const key of DIMENSION_KEYS) {
    dimensions[key] = dimensionValue(dimensionsSource, key)
  }
  const postRaw = value.post_processing ?? value['后期建议'] ?? value['后期处理'] ?? value['建议后期']
  const postProcessing = Array.isArray(postRaw)
    ? [...new Set(postRaw.filter(code => typeof code === 'string' && isPostProcessingCode(code)))]
    : []
  return {
    score: Math.min(10, Math.max(0, Math.round(score * 10) / 10)),
    verdict,
    dimensions,
    postProcessing,
    reason: normalizeReason(pickString(value.reason, value['理由'], value['原因'], value['说明']), 120),
  }
}
