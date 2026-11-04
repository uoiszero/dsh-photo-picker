import test from 'node:test'
import assert from 'node:assert/strict'
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
