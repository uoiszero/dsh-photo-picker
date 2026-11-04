import test from 'node:test'
import assert from 'node:assert/strict'
import { completeText } from '../src/host/llm.js'

function fakeLlm(script) {
  const calls = []
  return {
    calls,
    async *stream(options) {
      calls.push(options)
      const step = script.shift()
      if (step.failure !== undefined) {
        yield { type: 'finish', reason: { kind: 'error', failure: step.failure } }
        return
      }
      yield { type: 'text-delta', index: 0, text: step.text }
      yield { type: 'usage', usage: step.usage ?? { inputTokens: 10, outputTokens: 5 } }
      yield { type: 'finish', reason: { kind: 'stop' } }
    },
  }
}

test('completeText collects text and usage', async () => {
  const llm = fakeLlm([{ text: '{"score":8}' }])
  const result = await completeText({ llm, provider: 'p', model: 'm', system: 's', prompt: 'u', sleep: async () => {} })
  assert.equal(result.text, '{"score":8}')
  assert.deepEqual(result.usage, { inputTokens: 10, outputTokens: 5 })
  assert.equal(llm.calls[0].messages[0].content[0].text, 'u')
  assert.equal(llm.calls[0].system, 's')
})

test('completeText retries 5xx and succeeds', async () => {
  const sleeps = []
  const llm = fakeLlm([
    { failure: { message: 'upstream 502', code: 'HTTP_5XX', status: 502 } },
    { text: 'ok' },
  ])
  const result = await completeText({
    llm, provider: 'p', model: 'm', prompt: 'u',
    sleep: async ms => { sleeps.push(ms) },
  })
  assert.equal(result.text, 'ok')
  assert.equal(result.attempts, 2)
  assert.deepEqual(sleeps, [1000])
})

test('completeText surfaces non-retryable failures with the provider code', async () => {
  const llm = fakeLlm([{ failure: { message: 'bad key', code: 'AUTH', status: 401 } }])
  await assert.rejects(
    completeText({ llm, provider: 'p', model: 'm', prompt: 'u', sleep: async () => {} }),
    error => error.code === 'AUTH' && error.retryable === false,
  )
})

test('completeText aborts on timeout', async () => {
  const llm = {
    stream() {
      return {
        [Symbol.asyncIterator]() {
          return { next: () => new Promise(() => {}) }
        },
      }
    },
  }
  await assert.rejects(
    completeText({ llm, provider: 'p', model: 'm', prompt: 'u', timeoutMs: 5, sleep: async () => {} }),
    error => error.code === 'LLM_TIMEOUT' && error.retryable === true,
  )
})

test('completeText attaches an image block when given one', async () => {
  const llm = fakeLlm([{ text: 'ok' }])
  const attachment = { attachmentId: 'a1', mediaType: 'image/jpeg', bytes: 10, width: 4, height: 3 }
  await completeText({ llm, provider: 'p', model: 'm', prompt: 'u', image: attachment, sleep: async () => {} })
  const content = llm.calls[0].messages[0].content
  assert.equal(content[1].type, 'image')
  assert.deepEqual(content[1].attachment, attachment)
})
