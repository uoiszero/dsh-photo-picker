import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * 版本一致性检查：版本号在两处（根 package.json / plugin/package.json）
 * 以及 package-lock.json 的根条目；打 tag 时 tag 必须与版本一致。
 * 详见 AGENTS.md「发布」。
 */

const readJson = file => JSON.parse(readFileSync(file, 'utf8'))

const root = readJson('package.json')
const plugin = readJson('plugin/package.json')
const lock = readJson('package-lock.json')

const expected = root.version
assert.match(expected, /^\d+\.\d+\.\d+$/, `root version 不是 semver: ${expected}`)

const actual = {
  'plugin/package.json': plugin.version,
  'package-lock.json': lock.packages?.['']?.version,
}

for (const [file, version] of Object.entries(actual)) {
  assert.equal(version, expected, `${file} 版本 ${version} 与根 package.json 的 ${expected} 不一致`)
}

const tag = process.env.GITHUB_REF_NAME
if (tag !== undefined && tag.startsWith('v')) {
  assert.equal(tag, `v${expected}`, `tag ${tag} 与版本 v${expected} 不一致`)
}

console.log(`versions ok: ${expected}${tag === undefined ? '' : ` (tag ${tag})`}`)
