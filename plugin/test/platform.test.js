import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  canonicalPathKey,
  createPlatform,
  fromPortablePath,
  isSameOrInside,
  parseChosenPath,
  toPortablePath,
} from '../src/host/platform.js'

function fakeRun(handler = () => ({ stdout: '' })) {
  const calls = []
  const run = async (file, args, options) => {
    calls.push({ file, args, options })
    return handler(file, args, options)
  }
  return { run, calls }
}

test('parseChosenPath trims newlines, spaces and shell quotes', () => {
  assert.equal(parseChosenPath('  /photos/me/Pictures  \n'), '/photos/me/Pictures')
  assert.equal(parseChosenPath('"C:\\photos\\me\\旅行 2024"\r\n'), 'C:\\photos\\me\\旅行 2024')
  assert.equal(parseChosenPath('\n\n'), '')
  assert.equal(parseChosenPath(undefined), '')
})

test('darwin decodeToJpeg shells out to sips and cleans up', async () => {
  const { run, calls } = fakeRun(() => ({ stdout: '' }))
  const platform = createPlatform({ platform: 'darwin', run })
  const converted = await platform.decodeToJpeg('/photos/IMG_0001.HEIC')
  assert.equal(calls[0].file, 'sips')
  assert.deepEqual(calls[0].args.slice(0, 5), ['-s', 'format', 'jpeg', '--resampleWidth', '1600'])
  assert.ok(calls[0].args.includes('/photos/IMG_0001.HEIC'))
  assert.ok(converted.path.endsWith('.jpg'))
  await converted.cleanup()
})

test('win32 decodeToJpeg uses a WIC PowerShell script', async () => {
  const { run, calls } = fakeRun(() => ({ stdout: '' }))
  const platform = createPlatform({ platform: 'win32', run })
  const converted = await platform.decodeToJpeg('C:\\Photos\\旅行 2024\\IMG_0001.HEIC')
  assert.equal(calls[0].file, 'powershell.exe')
  assert.ok(calls[0].args.includes('-STA'))
  assert.ok(calls[0].args.includes('-File'))
  assert.ok(calls[0].args.includes('-In'))
  assert.ok(calls[0].args.includes('C:\\Photos\\旅行 2024\\IMG_0001.HEIC'))
  assert.ok(converted.path.endsWith('preview.jpg'))
  await converted.cleanup()
})

test('imageSize parses sips and WIC output', async () => {
  const darwin = createPlatform({
    platform: 'darwin',
    run: fakeRun(() => ({ stdout: 'pixelWidth: 4032\npixelHeight: 3024\n' })).run,
  })
  assert.deepEqual(await darwin.imageSize('/photos/a.HEIC'), { width: 4032, height: 3024 })

  const windows = createPlatform({
    platform: 'win32',
    run: fakeRun(() => ({ stdout: '4032x3024' })).run,
  })
  assert.deepEqual(await windows.imageSize('C:\\Photos\\a.HEIC'), { width: 4032, height: 3024 })
})

test('chooseFolder parses the selected path and rejects an empty selection', async () => {
  const darwin = createPlatform({
    platform: 'darwin',
    run: fakeRun(() => ({ stdout: ' /photos/me/Pictures/旅行 2024 \n' })).run,
  })
  assert.equal(await darwin.chooseFolder(), '/photos/me/Pictures/旅行 2024')

  const windowsScripts = []
  const windows = createPlatform({
    platform: 'win32',
    run: async (file, args) => {
      const fileIndex = args.indexOf('-File')
      windowsScripts.push(readFileSync(args[fileIndex + 1], 'utf8'))
      return { stdout: '"C:\\photos\\张三\\Pictures\\旅行 2024"\r\n' }
    },
  })
  assert.equal(await windows.chooseFolder(), 'C:\\photos\\张三\\Pictures\\旅行 2024')
  assert.match(windowsScripts[0], /TopMost = \$true/)
  assert.match(windowsScripts[0], /ShowDialog\(\$owner\)/)

  const cancelled = createPlatform({
    platform: 'darwin',
    run: fakeRun(() => ({ stdout: '\n' })).run,
  })
  await assert.rejects(cancelled.chooseFolder(), /no folder selected/)
})

test('revealPath uses open on macOS and a detached explorer on Windows', async () => {
  const macRun = fakeRun()
  const mac = createPlatform({ platform: 'darwin', run: macRun.run })
  await mac.revealPath('/photos/a.jpg', false)
  assert.equal(macRun.calls[0].file, 'open')
  assert.deepEqual(macRun.calls[0].args, ['-R', '/photos/a.jpg'])
  await mac.revealPath('/photos', true)
  assert.deepEqual(macRun.calls[1].args, ['/photos'])

  const spawned = []
  const windows = createPlatform({
    platform: 'win32',
    run: fakeRun().run,
    spawnProcess: (file, args, options) => {
      spawned.push({ file, args, options })
      return { unref() {} }
    },
  })
  await windows.revealPath('C:\\Photos\\a.jpg', false)
  assert.equal(spawned[0].file, 'explorer.exe')
  assert.deepEqual(spawned[0].args, ['/select,C:\\Photos\\a.jpg'])
  assert.equal(spawned[0].options.detached, true)
  await windows.revealPath('C:\\Photos', true)
  assert.deepEqual(spawned[1].args, ['C:\\Photos'])
})

test('unsupported platforms fail with UNSUPPORTED_PLATFORM', async () => {
  const linux = createPlatform({ platform: 'linux', run: fakeRun().run })
  await assert.rejects(linux.decodeToJpeg('/photos/a.HEIC'), error => error.code === 'UNSUPPORTED_PLATFORM')
  await assert.rejects(linux.imageSize('/photos/a.HEIC'), error => error.code === 'UNSUPPORTED_PLATFORM')
  await assert.rejects(linux.chooseFolder(), error => error.code === 'UNSUPPORTED_PLATFORM')
})

test('canonicalPathKey is case-insensitive on Windows only', () => {
  assert.equal(canonicalPathKey('C:\\Photos\\A.JPG', 'win32'), 'c:\\photos\\a.jpg')
  assert.equal(canonicalPathKey('/Photos/A.JPG', 'darwin'), '/Photos/A.JPG')
  assert.equal(canonicalPathKey('C:\\Photos\\', 'win32'), 'c:\\photos')
  assert.equal(canonicalPathKey('C:\\', 'win32'), 'c:\\')
})

test('isSameOrInside handles Windows drives, UNC, case and sibling prefixes', () => {
  assert.equal(isSameOrInside('C:\\Photos', 'c:\\photos\\sub\\a.jpg', 'win32'), true)
  assert.equal(isSameOrInside('C:\\Photos', 'C:\\Photos', 'win32'), true)
  assert.equal(isSameOrInside('C:\\Photos\\', 'C:\\Photos\\sub', 'win32'), true)
  assert.equal(isSameOrInside('C:\\Photos', 'C:\\Photos2\\a.jpg', 'win32'), false)
  assert.equal(isSameOrInside('C:\\Photos', 'C:\\Photos\\..\\Photos2\\a.jpg', 'win32'), false)
  assert.equal(isSameOrInside('C:\\', 'C:\\anything\\a.jpg', 'win32'), true)
  assert.equal(isSameOrInside('\\\\server\\share\\photos', '\\\\server\\share\\photos\\a.jpg', 'win32'), true)
  assert.equal(isSameOrInside('\\\\server\\share\\photos', '\\\\server\\share\\photos2\\a.jpg', 'win32'), false)
})

test('isSameOrInside stays case-sensitive and separator-correct on POSIX', () => {
  assert.equal(isSameOrInside('/photos', '/photos/sub/a.jpg', 'darwin'), true)
  assert.equal(isSameOrInside('/photos', '/photos2/a.jpg', 'darwin'), false)
  assert.equal(isSameOrInside('/photos', '/Photos/a.jpg', 'darwin'), false)
  assert.equal(isSameOrInside('/photos', '/photos/../photos/a.jpg', 'darwin'), true)
})

test('portable paths survive Chinese, spaces and long Windows paths', () => {
  assert.equal(toPortablePath('旅行 2024\\子目录\\IMG_0001.HEIC'), '旅行 2024/子目录/IMG_0001.HEIC')
  assert.equal(
    fromPortablePath('C:\\photos\\me\\Pictures', '旅行 2024/子目录/IMG_0001.HEIC', 'win32'),
    'C:\\photos\\me\\Pictures\\旅行 2024\\子目录\\IMG_0001.HEIC',
  )
  assert.equal(
    fromPortablePath('/photos/me/Pictures', '旅行 2024/子目录/IMG_0001.HEIC', 'darwin'),
    '/photos/me/Pictures/旅行 2024/子目录/IMG_0001.HEIC',
  )
  const long = `${'很长的子目录名称/'.repeat(40)}IMG_0001.HEIC`
  const absolute = fromPortablePath('C:\\Photos', long, 'win32')
  assert.ok(absolute.length > 260)
  assert.ok(absolute.endsWith('IMG_0001.HEIC'))
  assert.equal(isSameOrInside('C:\\Photos', absolute, 'win32'), true)
})

test('chooseFolder is single-flight while a dialog is open', async () => {
  let release
  const gate = new Promise(resolve => { release = resolve })
  const calls = []
  const windows = createPlatform({
    platform: 'win32',
    run: async (file, args) => {
      calls.push(args)
      await gate
      return { stdout: 'C:\\photos\\single' }
    },
  })
  const first = windows.chooseFolder()
  const second = windows.chooseFolder()
  for (let attempt = 0; attempt < 50 && calls.length === 0; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  assert.equal(calls.length, 1)
  release()
  const [a, b] = await Promise.all([first, second])
  assert.equal(a, 'C:\\photos\\single')
  assert.equal(a, b)
  assert.equal(calls.length, 1)
})
