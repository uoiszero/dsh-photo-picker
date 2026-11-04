const DEFAULT_TIMEOUT_MS = 120_000
const DEFAULT_MAX_ATTEMPTS = 3

/** 结构化模型调用错误；`code` 与 `retryable` 供编排层决定是否暂停。 */
export class LlmCallError extends Error {
  constructor(message, { code = 'LLM_ERROR', status, retryable = false, providerRetryAfterMs, attempts } = {}) {
    super(message)
    this.name = 'LlmCallError'
    this.code = code
    this.status = status
    this.retryable = retryable
    this.providerRetryAfterMs = providerRetryAfterMs
    if (attempts !== undefined) this.attempts = attempts
  }
}

function isRetryable(failure) {
  const status = failure?.status
  if (status === 429) return true
  if (typeof status === 'number' && status >= 500) return true
  return failure?.code === 'ETIMEDOUT' || failure?.code === 'ECONNRESET'
}

function failureToError(failure) {
  const status = failure?.status
  const aborted = failure?.code === 'LLM_ABORTED'
  return new LlmCallError(failure?.message ?? 'model call failed', {
    code: failure?.code ?? (status === undefined ? 'LLM_ERROR' : `HTTP_${status}`),
    status,
    retryable: aborted ? false : isRetryable(failure),
    providerRetryAfterMs: failure?.providerRetryAfterMs,
  })
}

function withTimeout(promise, timeoutMs, onTimeout) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      onTimeout?.()
      reject(new LlmCallError('model call timed out', { code: 'LLM_TIMEOUT', retryable: true }))
    }, timeoutMs)
  })
  // 超时后底层迭代可能还会 settle；附一个空 catch，避免迟到 rejection 变成未处理错误。
  promise.catch(() => {})
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

async function attemptOnce({ llm, provider, model, system, prompt, image, temperature, maxTokens, timeoutMs, signal }) {
  if (signal?.aborted === true) throw new LlmCallError('model call aborted', { code: 'LLM_ABORTED' })
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })

  const content = [{ type: 'text', text: prompt }]
  if (image !== undefined) content.push({ type: 'image', attachment: image })
  const options = {
    provider,
    model,
    messages: [{ role: 'user', content }],
    temperature,
    maxTokens,
    signal: controller.signal,
  }
  if (system !== undefined) options.system = system

  let text = ''
  let usage = { inputTokens: 0, outputTokens: 0 }
  let failure
  const iteration = (async () => {
    for await (const chunk of llm.stream(options)) {
      if (chunk.type === 'text-delta') text += chunk.text
      else if (chunk.type === 'block-end' && chunk.block?.type === 'text' && text === '') text = chunk.block.text
      else if (chunk.type === 'usage') usage = chunk.usage
      else if (chunk.type === 'finish') {
        if (chunk.reason.kind === 'error' || chunk.reason.kind === 'aborted') failure = chunk.reason.failure
      }
    }
  })()

  try {
    await withTimeout(iteration, timeoutMs, () => controller.abort())
  } catch (error) {
    if (error instanceof LlmCallError) throw error
    throw error instanceof Error
      ? new LlmCallError(error.message, { code: 'LLM_ERROR', retryable: false })
      : new LlmCallError(String(error), { code: 'LLM_ERROR', retryable: false })
  } finally {
    signal?.removeEventListener('abort', onAbort)
  }

  if (signal?.aborted === true) {
    throw new LlmCallError('model call aborted', { code: 'LLM_ABORTED' })
  }
  if (failure !== undefined) throw failureToError(failure)
  if (text.trim() === '') throw new LlmCallError('model returned no text', { code: 'EMPTY_RESPONSE', retryable: true })
  return { text, usage }
}

/**
 * 一次性文本调用：可带一张图片，收集文本与 usage，按 429/5xx/超时重试。
 * @returns {{ text: string, usage: object, attempts: number, durationMs: number }}
 */
export async function completeText({
  llm, provider, model, system, prompt, image,
  temperature = 0, maxTokens = 256,
  timeoutMs = DEFAULT_TIMEOUT_MS, maxAttempts = DEFAULT_MAX_ATTEMPTS,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  signal,
}) {
  const startedAt = Date.now()
  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await attemptOnce({
        llm, provider, model, system, prompt, image, temperature, maxTokens, timeoutMs, signal,
      })
      return { ...result, attempts: attempt, durationMs: Date.now() - startedAt }
    } catch (error) {
      lastError = error
      if (!(error instanceof LlmCallError) || error.retryable !== true || attempt === maxAttempts) {
        if (error instanceof LlmCallError) error.attempts = attempt
        throw error
      }
      const backoff = 1000 * 2 ** (attempt - 1)
      await sleep(error.providerRetryAfterMs ?? backoff)
    }
  }
  throw lastError
}
