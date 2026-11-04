import test from 'node:test'
import assert from 'node:assert/strict'
import {
  POST_PROCESSING_CODES,
  isPostProcessingCode,
  parseGridSelection,
  parseRank,
  parseScore,
} from '../src/host/parse.js'
import { PROMPT_VERSION, gridUserPrompt } from '../src/host/prompts.js'

const DIMENSIONS = ['composition', 'light', 'color', 'technique', 'post_potential', 'moment']

test('parseGridSelection accepts a JSON array and drops unknown codes', () => {
  const result = parseGridSelection('["A1","B2","Z9"]', ['A1', 'B2', 'C3'])
  assert.deepEqual(result, { codes: ['A1', 'B2'], parsed: true })
})

test('parseGridSelection tolerates fences, prose and duplicate codes', () => {
  const text = '好的，我选出：\n```json\n["a1", "C3", "A1"]\n```'
  const result = parseGridSelection(text, ['A1', 'B2', 'C3'])
  assert.deepEqual(result.codes, ['A1', 'C3'])
  assert.equal(result.parsed, true)
})

test('parseGridSelection falls back to a bare-code regex', () => {
  const result = parseGridSelection('我选 A1 和 C3，其余不要', ['A1', 'B2', 'C3'])
  assert.deepEqual(result.codes, ['A1', 'C3'])
})

test('parseGridSelection reports an empty parse', () => {
  const result = parseGridSelection('我一张都不选', ['A1'])
  assert.deepEqual(result, { codes: [], parsed: false })
})

test('parseScore normalizes dimensions, whitelist and reason length', () => {
  const payload = {
    score: 12,
    dimensions: { composition: 8, light: 7, color: 8, technique: 9, post_potential: 7, moment: 6 },
    verdict: 'keep',
    post_processing: ['crop_right', 'not_a_real_code'],
    reason: '主'.repeat(200),
  }
  const parsed = parseScore('```json\n' + JSON.stringify(payload) + '\n```')
  assert.equal(parsed.score, 10)
  assert.equal(parsed.verdict, 'keep')
  for (const key of DIMENSIONS) assert.equal(typeof parsed.dimensions[key], 'number')
  assert.deepEqual(parsed.postProcessing, ['crop_right'])
  assert.equal(parsed.reason.length, 120)
})

test('parseScore fills missing dimensions with null', () => {
  const parsed = parseScore(JSON.stringify({ score: 6.5, verdict: 'maybe', dimensions: { light: 6 }, reason: 'ok' }))
  assert.equal(parsed.dimensions.composition, null)
  assert.equal(parsed.dimensions.light, 6)
})

test('parseScore rejects unparseable or invalid payloads', () => {
  assert.throws(() => parseScore('not json at all'), error => error.code === 'BAD_MODEL_JSON')
  assert.throws(
    () => parseScore(JSON.stringify({ score: 8, verdict: 'great', dimensions: {}, reason: 'x' })),
    error => error.code === 'BAD_MODEL_JSON',
  )
})

test('parseRank validates order and best against the given labels', () => {
  const parsed = parseRank('{"order":["A","C","B"],"best":"A","reason":"左侧更干净"}', ['A', 'B', 'C'])
  assert.deepEqual(parsed.order, ['A', 'C', 'B'])
  assert.equal(parsed.best, 'A')
  assert.equal(parsed.reason, '左侧更干净')

  assert.throws(
    () => parseRank('{"order":["A"],"best":"Z","reason":"x"}', ['A', 'B']),
    error => error.code === 'BAD_MODEL_JSON',
  )
})

test('post processing whitelist and prompt version are the spec values', () => {
  assert.equal(PROMPT_VERSION, 'v1')
  assert.ok(POST_PROCESSING_CODES.has('crop_right'))
  assert.ok(isPostProcessingCode('straighten_+1.5'))
  assert.ok(isPostProcessingCode('exposure_-0.3'))
  assert.ok(!isPostProcessingCode('rotate'))
  const prompt = gridUserPrompt({ count: 16, cols: 4, rows: 4, theme: 'portrait' })
  assert.match(prompt, /4 列 × 4 行/)
  assert.match(prompt, /人像/)
})
