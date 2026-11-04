/** DeepSeek 离峰价（本机 cost-meter 表 2026-11-04）：输入 1 元/M、缓存读 0.02 元/M、输出 4 元/M。 */
export const PRICES = { inputPerM: 1, outputPerM: 4, cacheReadPerM: 0.02 }
export const PEAK_MULTIPLIER = 2

/** 工作日 9:00–12:00、14:00–18:00 为高峰（进程本地时区）。 */
export function isPeakHour(date) {
  const day = date.getDay()
  if (day === 0 || day === 6) return false
  const hour = date.getHours() + date.getMinutes() / 60
  return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18)
}

/** 一次调用的实际费用（元）。cached 计数与 input/output 互斥。 */
export function costOfUsage(usage, { peak = false } = {}) {
  const input = (usage.inputTokens ?? 0) / 1e6 * PRICES.inputPerM
  const cacheRead = (usage.cacheReadTokens ?? 0) / 1e6 * PRICES.cacheReadPerM
  const cacheWrite = (usage.cacheWriteTokens ?? 0) / 1e6 * PRICES.inputPerM
  const output = (usage.outputTokens ?? 0) / 1e6 * PRICES.outputPerM
  const total = input + cacheRead + cacheWrite + output
  return peak ? total * PEAK_MULTIPLIER : total
}

/** 建项目/检查点展示用的流水线预估（spec 8.6）。 */
export function estimatePipeline({ candidates, rankGroups = 0, singlePhotos = 0 }) {
  const calls = {
    grid: Math.ceil(candidates / 16),
    rank: rankGroups,
    single: singlePhotos,
  }
  const usage = {
    inputTokens: calls.grid * 1100 + calls.rank * 1300 + calls.single * 1100,
    outputTokens: calls.grid * 80 + calls.rank * 120 + calls.single * 200,
  }
  const costCny = costOfUsage(usage, { peak: false })
  return { calls, usage, costCny, costPeakCny: costOfUsage(usage, { peak: true }) }
}
