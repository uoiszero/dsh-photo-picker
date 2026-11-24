export const CURVE_CHANNELS = ['master', 'r', 'g', 'b', 'luma']
export const MAX_CURVE_POINTS = 16
export const DEFAULT_CURVE_POINTS = [[0, 0], [1, 1]]

const clamp01 = value => Math.min(1, Math.max(0, value))
const round4 = value => Math.round(value * 10_000) / 10_000
const pointOf = point => {
  if (Array.isArray(point)) return { x: Number(point[0]), y: Number(point[1]) }
  if (point && typeof point === 'object') return { x: Number(point.x), y: Number(point.y) }
  return { x: NaN, y: NaN }
}
const identity = () => DEFAULT_CURVE_POINTS.map(point => [...point])

function evenlyTrim(points, maxPoints) {
  if (points.length <= maxPoints) return points
  const picked = []
  for (let index = 0; index < maxPoints; index++) {
    const at = Math.round(index * (points.length - 1) / (maxPoints - 1))
    picked.push(points[at])
  }
  return picked
}

/** 把任意曲线输入规范成 0..1 的控制点；端点固定，x 严格递增。 */
export function normalizeCurve(input, { maxPoints = MAX_CURVE_POINTS } = {}) {
  if (!Array.isArray(input)) return identity()
  const points = input.map(pointOf)
    .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
    .map(point => ({ x: round4(clamp01(point.x)), y: round4(clamp01(point.y)) }))
    .sort((a, b) => a.x - b.x)

  const deduped = []
  for (const point of points) {
    const last = deduped[deduped.length - 1]
    if (last !== undefined && Math.abs(last.x - point.x) < 1e-6) deduped[deduped.length - 1] = point
    else deduped.push(point)
  }

  const withEndpoints = deduped
    .filter(point => point.x > 1e-6 && point.x < 1 - 1e-6)
    .map(point => [point.x, point.y])
  return evenlyTrim([[0, 0], ...withEndpoints, [1, 1]], maxPoints)
}

export function isIdentityCurve(input) {
  const points = normalizeCurve(input)
  return points.length === 2
    && Math.abs(points[0][0]) < 1e-6
    && Math.abs(points[0][1]) < 1e-6
    && Math.abs(points[1][0] - 1) < 1e-6
    && Math.abs(points[1][1] - 1) < 1e-6
}

export function normalizeCurves(input) {
  const source = input && typeof input === 'object' ? input : {}
  const curves = {}
  for (const channel of CURVE_CHANNELS) curves[channel] = normalizeCurve(source[channel])
  return curves
}

export function isIdentityCurves(input) {
  if (input === null || input === undefined) return true
  if (typeof input !== 'object') return true
  return CURVE_CHANNELS.every(channel => isIdentityCurve(input[channel]))
}

function slopesFor(points) {
  const delta = []
  const slope = []
  for (let index = 0; index < points.length - 1; index++) {
    const dx = points[index + 1][0] - points[index][0]
    delta.push(dx === 0 ? 0 : (points[index + 1][1] - points[index][1]) / dx)
  }
  slope[0] = delta[0] ?? 0
  for (let index = 1; index < points.length - 1; index++) {
    const before = delta[index - 1]
    const after = delta[index]
    if (before * after <= 0) slope[index] = 0
    else slope[index] = (before + after) / 2
  }
  slope[points.length - 1] = delta[delta.length - 1] ?? 0

  // Fritsch-Carlson：防止分段三次插值过冲。
  for (let index = 0; index < delta.length; index++) {
    if (delta[index] === 0) {
      slope[index] = 0
      slope[index + 1] = 0
      continue
    }
    const a = slope[index] / delta[index]
    const b = slope[index + 1] / delta[index]
    const magnitude = Math.hypot(a, b)
    if (magnitude > 3) {
      slope[index] = 3 * a / magnitude * delta[index]
      slope[index + 1] = 3 * b / magnitude * delta[index]
    }
  }
  return { delta, slope }
}

/** 单调三次 Hermite 插值；输入 x 超出范围时取端点。 */
export function sampleCurve(input, x) {
  const points = normalizeCurve(input)
  const at = clamp01(Number.isFinite(x) ? x : 0)
  if (at <= 0) return 0
  if (at >= 1) return 1

  let index = 0
  while (index < points.length - 2 && at > points[index + 1][0]) index += 1
  const [x0, y0] = points[index]
  const [x1, y1] = points[index + 1]
  const { slope } = slopesFor(points)
  const width = x1 - x0
  if (width <= 0) return y1
  const t = (at - x0) / width
  const t2 = t * t
  const t3 = t2 * t
  return round4((2 * t3 - 3 * t2 + 1) * y0
    + (t3 - 2 * t2 + t) * width * slope[index]
    + (-2 * t3 + 3 * t2) * y1
    + (t3 - t2) * width * slope[index + 1])
}

/** 256 项（或指定大小）的 8-bit LUT。 */
export function curveLut(input, size = 256) {
  const points = normalizeCurve(input)
  const limit = Math.max(2, Math.floor(size))
  const lut = new Uint8Array(limit)
  for (let index = 0; index < limit; index++) {
    lut[index] = Math.round(clamp01(sampleCurve(points, index / (limit - 1))) * 255)
  }
  return lut
}

/** 给 SVG 使用的路径；y 轴翻转，视口为 100×100。 */
export function curvePath(input) {
  const points = normalizeCurve(input)
  const commands = []
  for (let index = 0; index <= 100; index++) {
    const x = index / 100
    const y = sampleCurve(points, x)
    commands.push(`${index === 0 ? 'M' : 'L'}${round4(x * 100)},${round4((1 - y) * 100)}`)
  }
  return commands.join(' ')
}
