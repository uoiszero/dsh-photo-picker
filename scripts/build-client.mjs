import { build } from 'esbuild'
import { mkdir, writeFile } from 'node:fs/promises'

const result = await build({
  entryPoints: ['plugin/src/client/index.tsx'],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  jsx: 'transform',
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
  external: ['react', 'react-dom'],
  logLevel: 'warning',
})

const code = result.outputFiles[0].text
const wrapped = `window.__ModuleLoader__.load({
  id: 'dsh-photo-picker',
  factory(require) {
    const module = { exports: {} };
    const exports = module.exports;
${code}
    return module.exports;
  },
});
`

await mkdir('plugin/dist', { recursive: true })
await writeFile('plugin/dist/client.js', wrapped)
console.log('built plugin/dist/client.js')
