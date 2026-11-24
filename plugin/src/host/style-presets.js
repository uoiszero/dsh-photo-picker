import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { nanoid } from 'nanoid'
import { normalizeCurves } from '../shared/curves.js'
import { workbenchStoreDir } from './paths.js'

const EMPTY = { version: 1, presets: [] }
const MAX_NAME = 80

export function stylePresetsPath() {
  return path.join(workbenchStoreDir(), 'style-presets.json')
}

function clampNumber(value, fallback = 0, min = -1, max = 1) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback
}

function normalizeAnalysis(input) {
  if (input === null || typeof input !== 'object') return null
  const tags = Array.isArray(input.tags)
    ? input.tags.filter(tag => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean).slice(0, 8)
    : []
  return {
    source: input.source === 'ai' ? 'ai' : 'local',
    modelRoute: typeof input.modelRoute === 'string' ? input.modelRoute : null,
    modelId: typeof input.modelId === 'string' ? input.modelId : null,
    description: typeof input.description === 'string' ? input.description.slice(0, 800) : '',
    tags,
    confidence: clampNumber(input.confidence, 0, 0, 1),
    tokensIn: Number.isFinite(input.tokensIn) ? Math.max(0, input.tokensIn) : 0,
    tokensOut: Number.isFinite(input.tokensOut) ? Math.max(0, input.tokensOut) : 0,
    costCny: Number.isFinite(input.costCny) ? Math.max(0, input.costCny) : 0,
    warning: typeof input.warning === 'string' ? input.warning.slice(0, 400) : null,
  }
}

export function normalizeStylePreset(input) {
  if (input === null || typeof input !== 'object') return null
  const name = typeof input.name === 'string' ? input.name.trim().slice(0, MAX_NAME) : ''
  if (name === '') return null
  return {
    id: typeof input.id === 'string' && input.id !== '' ? input.id : nanoid(),
    name,
    description: typeof input.description === 'string' ? input.description.slice(0, 500) : '',
    version: 1,
    createdAt: Number.isFinite(input.createdAt) ? input.createdAt : Date.now(),
    sampleCount: Number.isFinite(input.sampleCount) ? Math.min(5, Math.max(1, Math.floor(input.sampleCount))) : 1,
    curves: normalizeCurves(input.curves),
    saturation: clampNumber(input.saturation, 0, -1, 1),
    analysis: normalizeAnalysis(input.analysis),
  }
}

export function readStylePresets(file = stylePresetsPath()) {
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    if (parsed === null || typeof parsed !== 'object' || !Array.isArray(parsed.presets)) {
      return structuredClone(EMPTY)
    }
    return {
      version: 1,
      presets: parsed.presets.map(normalizeStylePreset).filter(Boolean),
    }
  } catch (error) {
    if (error?.code === 'ENOENT') return structuredClone(EMPTY)
    // A damaged global preset file should not block photo editing.
    return structuredClone(EMPTY)
  }
}

export function writeStylePresets(value, file = stylePresetsPath()) {
  mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.${nanoid(6)}.tmp`
  writeFileSync(tmp, JSON.stringify({ version: 1, presets: value.presets }, null, 2), 'utf8')
  renameSync(tmp, file)
}

export function listStylePresets(file = stylePresetsPath()) {
  return readStylePresets(file).presets
}

export function saveStylePreset(input, file = stylePresetsPath()) {
  const preset = normalizeStylePreset(input)
  if (preset === null) {
    const error = new Error('style preset needs a name')
    error.code = 'BAD_STYLE_PRESET'
    error.statusCode = 400
    throw error
  }
  const current = readStylePresets(file)
  const presets = [preset, ...current.presets.filter(item => item.id !== preset.id)].slice(0, 100)
  writeStylePresets({ presets }, file)
  return preset
}

export function deleteStylePreset(id, file = stylePresetsPath()) {
  const current = readStylePresets(file)
  const before = current.presets.length
  const presets = current.presets.filter(item => item.id !== id)
  if (presets.length === before) return false
  writeStylePresets({ presets }, file)
  return true
}
