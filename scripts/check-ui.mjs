import { readFileSync } from 'node:fs'

/**
 * Phase 1 基线：先报告仍有待迁移的 UI 内联样式。
 * Phase 7 会把这里的违规数变成硬门禁。
 */
const index = readFileSync('plugin/src/client/index.tsx', 'utf8')
const theme = readFileSync('plugin/src/client/theme.js', 'utf8')

const checks = [
  ['inline secondary button', /style=\{btn\}/g],
  ['inline primary button', /style=\{btnPrimary\}/g],
  ['legacy btn constant', /const btn\s*=/g],
  ['legacy btnPrimary constant', /const btnPrimary\s*=/g],
  ['raw status hex in index', /#2f9e5f|#d09a2b|#cc4b3f/g, index],
  ['raw status hex in theme', /#2f9e5f|#d09a2b|#cc4b3f/g, theme],
]

let total = 0
for (const [name, pattern, source = index] of checks) {
  const count = source.match(pattern)?.length ?? 0
  total += count
  console.log(`${name}: ${count}`)
}
console.log(`total UI migration warnings: ${total}`)
