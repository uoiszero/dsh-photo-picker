import test from 'node:test'
import assert from 'node:assert/strict'
import { costOfUsage, estimatePipeline, isPeakHour } from '../src/host/cost.js'

test('costOfUsage prices off-peak input/output/cache', () => {
  // 1M 输入 = 1 元；1M 输出 = 4 元；1M 缓存读 = 0.02 元
  assert.equal(costOfUsage({ inputTokens: 1_000_000, outputTokens: 0 }, { peak: false }), 1)
  assert.equal(costOfUsage({ inputTokens: 0, outputTokens: 1_000_000 }, { peak: false }), 4)
  assert.equal(costOfUsage({ inputTokens: 0, outputTokens: 0, cacheReadTokens: 1_000_000 }, { peak: false }), 0.02)
  assert.equal(costOfUsage({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, { peak: true }), 10)
})

test('isPeakHour matches the weekday windows', () => {
  // 2026-11-04 是周三（进程本地时区）
  assert.equal(isPeakHour(new Date(2026, 10, 4, 10, 0)), true)
  assert.equal(isPeakHour(new Date(2026, 10, 4, 13, 0)), false)
  assert.equal(isPeakHour(new Date(2026, 10, 4, 15, 0)), true)
  assert.equal(isPeakHour(new Date(2026, 10, 7, 10, 0)), false) // 周六
})

test('estimatePipeline scales with candidate and group counts', () => {
  const estimate = estimatePipeline({ candidates: 1600, rankGroups: 10, singlePhotos: 120 })
  // 网格 100 次、排序 10 次、精评 120 次
  assert.equal(estimate.calls.grid, 100)
  assert.equal(estimate.calls.rank, 10)
  assert.equal(estimate.calls.single, 120)
  assert.ok(estimate.costCny > 0)
  assert.ok(estimate.costPeakCny > estimate.costCny)
})
