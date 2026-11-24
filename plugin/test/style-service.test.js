import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { PhotoPickerService } from '../src/host/service.js'

function fakeLlm(text, usage = { inputTokens: 12, outputTokens: 8 }) {
  return {
    async *stream() {
      yield { type: 'text-delta', text }
      yield { type: 'usage', usage }
      yield { type: 'finish', reason: { kind: 'stop' } }
    },
  }
}

async function withService({ text, fail = false }, run) {
  const home = mkdtempSync(path.join(tmpdir(), 'pp-style-home-'))
  const source = path.join(home, 'source')
  mkdirSync(source)
  const sample = path.join(source, 'sample.png')
  await sharp({ create: { width: 48, height: 48, channels: 3, background: { r: 120, g: 80, b: 50 } } }).png().toFile(sample)
  const previous = process.env.DSH_HOME
  process.env.DSH_HOME = home
  const project = { id: 'p1', name: 'samples', sourceKind: 'local', sourcePath: source, workspaceDir: path.join(home, 'workspace'), modelRoute: 'deepseek-official', modelId: 'deepseek-flash' }
  const service = {
    store: {
      async open() {
        return {
          project,
          db: { prepare() { return { get() { return { id: 'ph1', rel_path: 'sample.png' } } } } },
        }
      },
    },
    async freshProject() { return project },
    async imageCapable() { return true },
    ctx: {
      attachments: { async saveImage() { return { id: 'img1' } } },
      llm: {
        async *stream(options) {
          if (fail) throw new Error('model unavailable')
          yield* fakeLlm(text).stream(options)
        },
      },
    },
  }
  try {
    await run(service)
  } finally {
    if (previous === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previous
    rmSync(home, { recursive: true, force: true })
  }
}

test('AI style extraction merges the model response and records usage', async () => {
  const text = JSON.stringify({
    name: 'AI Warm', description: 'warm', tone: { contrast: 0.1, warmth: 0.2, saturation: 0.1 },
    tags: ['film'], confidence: 0.8,
  })
  await withService({ text }, async service => {
    const result = await PhotoPickerService.prototype.createStylePreset.call(service, {
      useAi: true,
      items: [{ projectId: 'p1', photoId: 'ph1' }],
    })
    assert.equal(result.preset.name, 'AI Warm')
    assert.equal(result.preset.analysis.source, 'ai')
    assert.equal(result.preset.analysis.tokensIn, 12)
    assert.equal(result.preset.analysis.tokensOut, 8)
    assert.equal(result.warning, null)
  })
})

test('AI style extraction falls back to local statistics when the model fails', async () => {
  await withService({ fail: true }, async service => {
    const result = await PhotoPickerService.prototype.createStylePreset.call(service, {
      name: 'Local fallback',
      useAi: true,
      items: [{ projectId: 'p1', photoId: 'ph1' }],
    })
    assert.equal(result.preset.name, 'Local fallback')
    assert.equal(result.preset.analysis.source, 'local')
    assert.match(result.warning, /AI style analysis failed/)
  })
})
