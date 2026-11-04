import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

/**
 * 仓库卫生检查：防止个人路径、密钥、数据库、本地 file: 依赖进入仓库。
 * 见 AGENTS.md「工程约定」「发布」。CI 与 `npm run verify` 都会跑。
 */

const git = args => execFileSync('git', args, { encoding: 'utf8' })
const tracked = git(['ls-files', '-z']).split('\0').filter(Boolean)

const issues = []

// 1. 已提交的客户端产物（宿主在启动时缓存 dsh.client，缺了插件加载不到面板）。
if (!tracked.includes('plugin/dist/client.js')) {
  issues.push('plugin/dist/client.js 未被跟踪：改过客户端后需要 npm run build:client 并提交产物')
}

// 2. 不该进仓库的文件（数据库 / 环境文件 / 私钥）。
const forbidden = [
  /(^|\/)\.env(\.|$)/,
  /\.sqlite3?$/,
  /(^|\/)db\.db$/,
  /\.(pem|key|p12|pfx)$/,
]
for (const file of tracked) {
  if (forbidden.some(pattern => pattern.test(file))) issues.push(`禁止提交的文件: ${file}`)
}

// 3. 本地 file:/link: 依赖：干净 clone 里解析不到，CI 一定失败。
const packageFiles = tracked.filter(file => file === 'package.json' || file.endsWith('/package.json'))
for (const file of packageFiles) {
  const manifest = JSON.parse(readFileSync(file, 'utf8'))
  for (const field of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    for (const [name, spec] of Object.entries(manifest[field] ?? {})) {
      if (typeof spec === 'string' && /^(file|link):/.test(spec)) {
        issues.push(`${file} 的 ${field}.${name} 用了本地依赖 ${spec}：干净 clone / CI 无法安装`)
      }
    }
  }
}

// 4. 文本文件里扫个人绝对路径和密钥形态。
const textExtensions = /\.(md|js|mjs|cjs|ts|tsx|json|yml|yaml|svg|html|txt|css)$/
const secretPatterns = [
  [/\/Users\/[A-Za-z0-9._-]+\//, '个人绝对路径 /Users/<name>/'],
  [/C:\\\\Users\\\\[A-Za-z0-9._-]+\\/, '个人绝对路径 C:\\Users\\<name>\\'],
  [/sk-[A-Za-z0-9_-]{20,}/, '疑似 API Key (sk-…)'],
  [/AKIA[0-9A-Z]{16}/, '疑似 AWS Access Key'],
]
for (const file of tracked) {
  if (!textExtensions.test(file)) continue
  const content = readFileSync(file, 'utf8')
  for (const [pattern, label] of secretPatterns) {
    if (pattern.test(content)) issues.push(`${file}: 命中${label}`)
  }
}

assert.deepEqual(issues, [], `仓库卫生检查失败:\n- ${issues.join('\n- ')}`)
console.log(`hygiene ok: ${tracked.length} 个跟踪文件`)
