import { readFileSync } from 'node:fs'

const index = readFileSync('plugin/src/client/index.tsx', 'utf8')
const theme = readFileSync('plugin/src/client/theme.js', 'utf8')

const checks = [
  ['inline secondary button', /style=\{btn\}/g, index],
  ['inline primary button', /style=\{btnPrimary\}/g, index],
  ['legacy btn constant', /const btn\s*=/g, index],
  ['legacy btnPrimary constant', /const btnPrimary\s*=/g, index],
  ['raw status hex in index', /#2f9e5f|#d09a2b|#cc4b3f/g, index],
  [
    'raw status hex in theme',
    null,
    theme.split('\n').filter(line => (
      /#2f9e5f|#d09a2b|#cc4b3f/i.test(line)
      && !line.includes('--pp-status-')
      && !line.includes('--dsw-alias-state-danger-primary')
    )).length,
  ],
]

let total = 0
for (const [name, pattern, source] of checks) {
  const count = pattern === null ? source : (source.match(pattern)?.length ?? 0)
  total += count
  console.log(`${name}: ${count}`)
}
if (total > 0) {
  console.error(`UI check failed: ${total} legacy visual-style violations`)
  process.exit(1)
}
console.log('UI check ok')
