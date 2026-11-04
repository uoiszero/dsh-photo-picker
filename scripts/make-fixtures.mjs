import sharp from 'sharp'
import { copyFile, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'

const root = process.argv[2] ?? '/tmp/pp-fixtures'
await rm(root, { recursive: true, force: true })
await mkdir(root, { recursive: true })

function noise(width, height, seed) {
  const data = Buffer.allocUnsafe(width * height * 3)
  let state = seed >>> 0
  for (let i = 0; i < data.length; i += 3) {
    state = (state * 1664525 + 1013904223) >>> 0
    data[i] = state & 0xff
    data[i + 1] = (state >>> 8) & 0xff
    data[i + 2] = (state >>> 16) & 0xff
  }
  return sharp(data, { raw: { width, height, channels: 3 } })
}

const noisy = (file, width, height, seed) =>
  noise(width, height, seed).jpeg({ quality: 90 }).toFile(file)

for (let i = 0; i < 40; i++) await noisy(path.join(root, `u-${String(i).padStart(2, '0')}.jpg`), 2000, 1500, i + 1)
for (let i = 0; i < 20; i++) await copyFile(path.join(root, `u-${String(i).padStart(2, '0')}.jpg`), path.join(root, `d-${String(i).padStart(2, '0')}.jpg`))
for (let i = 0; i < 20; i++) {
  // 每张白图带一个位置不同的黑点：字节不同（不去重），但仍是过曝图。
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="1500">
    <rect width="2000" height="1500" fill="#ffffff"/>
    <rect x="${10 + i * 60}" y="10" width="12" height="12" fill="#000000"/>
  </svg>`
  await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(path.join(root, `w-${String(i).padStart(2, '0')}.jpg`))
}
for (let i = 0; i < 20; i++) await noisy(path.join(root, `s-${String(i).padStart(2, '0')}.jpg`), 800, 600, 1000 + i)
for (let i = 0; i < 20; i++) await noisy(path.join(root, `p-${String(i).padStart(2, '0')}.jpg`), 2000, 1500, 2000 + i)

console.log(JSON.stringify({ root, photos: 120 }))
