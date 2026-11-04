import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  detectLanguage, en, getLanguagePreference, translate, zh,
} from '../src/client/locales.js'

test('detectLanguage follows browser languages and picks the first supported one', () => {
  assert.equal(detectLanguage({ languages: ['zh-CN', 'zh'] }, null), 'zh')
  assert.equal(detectLanguage({ languages: ['en-US', 'en'] }, null), 'en')
  assert.equal(detectLanguage({ languages: ['fr-FR', 'de-DE'] }, null), 'en')
  assert.equal(detectLanguage({ languages: ['fr-FR', 'zh-HK'] }, null), 'zh')
  assert.equal(detectLanguage({ language: 'zh-TW' }, null), 'zh')
  assert.equal(detectLanguage({ language: 'en-GB' }, null), 'en')
  assert.equal(detectLanguage({}, null), 'en')
})

test('detectLanguage prefers an explicit stored override', () => {
  assert.equal(detectLanguage({ languages: ['zh-CN'] }, 'en'), 'en')
  assert.equal(detectLanguage({ languages: ['en-US'] }, 'zh'), 'zh')
  assert.equal(detectLanguage({ languages: ['zh-CN'] }, 'fr'), 'zh')
})

test('translate falls back to English and then the key', () => {
  assert.equal(translate('zh', 'export'), '导出')
  assert.equal(translate('en', 'export'), 'Export')
  assert.equal(translate('en', 'not.a.key'), 'not.a.key')
})

test('zh and en dictionaries keep the same keys', () => {
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort())
})

test('getLanguagePreference is auto without localStorage', () => {
  assert.equal(getLanguagePreference(), 'auto')
})

test('every literal t() key used by the panel exists in both dictionaries', () => {
  const source = readFileSync(new URL('../src/client/index.tsx', import.meta.url), 'utf8')
  const used = [...source.matchAll(/t\('([^']+)'\)/g)].map(match => match[1])
  const missingZh = [...new Set(used)].filter(key => !(key in zh))
  const missingEn = [...new Set(used)].filter(key => !(key in en))
  assert.deepEqual(missingZh, [])
  assert.deepEqual(missingEn, [])
})

test('enum label keys cover technical values shown in the panel', () => {
  const keys = [
    'verdictKeep', 'verdictMaybe', 'verdictReject',
    'stateOk', 'stateUnreadable', 'stateFilteredBlur', 'stateFilteredExposure',
    'stateFilteredSmall', 'stateGridSelected', 'stateGridRejected', 'stateGridError',
    'stateScored', 'stateScoreFailed',
    'runPending', 'runRunning', 'runPaused', 'runDone', 'runFailed', 'runCancelled',
    'statPhotos', 'statSelected', 'statRejected', 'statGroups', 'statScored',
    'phaseStart', 'phaseDone', 'photos', 'close',
  ]
  for (const key of keys) {
    assert.ok(typeof zh[key] === 'string' && zh[key].length > 0, `zh missing ${key}`)
    assert.ok(typeof en[key] === 'string' && en[key].length > 0, `en missing ${key}`)
  }
})
