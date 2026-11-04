import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { openDb } from '../src/host/db.js'
import { LocalSource } from '../src/host/source.js'
import { scanProject } from '../src/host/scan.js'
import { preprocessProject } from '../src/host/preprocess.js'

async function gradient(file, width, height, from, to, direction = 'horizontal', quality = 90) {
  const dx = direction === 'vertical' ? 0 : 1
  const dy = direction === 'horizontal' ? 0 : 1
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="${dx}" y2="${dy}">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/></svg>`
  await sharp(Buffer.from(svg)).jpeg({ quality }).toFile(file)
}

async function solid(file, width, height, color) {
  await sharp({ create: { width, height, channels: 3, background: color } })
    .jpeg({ quality: 90 }).toFile(file)
}

test('preprocess dedupes, filters and groups similar frames', async () => {
  const base = mkdtempSync(path.join(tmpdir(), 'pp-pre-'))
  const photos = path.join(base, 'photos')
  const workspace = path.join(base, 'work')
  mkdirSync(photos, { recursive: true })
  mkdirSync(workspace, { recursive: true })

  // a.jpg 与 a-dup.jpg 字节相同；pair-1/2 像素相同但质量不同（sha 不同、dHash 相同）。
  await gradient(path.join(photos, 'a.jpg'), 2000, 1500, '#ff0000', '#0000ff')
  copyFileSync(path.join(photos, 'a.jpg'), path.join(photos, 'a-dup.jpg'))
  await solid(path.join(photos, 'white.jpg'), 2000, 1500, '#ffffff')
  await gradient(path.join(photos, 'small.jpg'), 800, 600, '#00ff00', '#0000ff', 'vertical')
  await gradient(path.join(photos, 'pair-1.jpg'), 2000, 1500, '#227755', '#882244', 'diagonal', 92)
  await gradient(path.join(photos, 'pair-2.jpg'), 2000, 1500, '#227755', '#882244', 'diagonal', 80)

  const db = openDb(workspace)
  db.prepare(`INSERT INTO projects (id, name, workspace_dir, source_kind, source_path, created_at, updated_at)
              VALUES ('p1', 'p', ?, 'local', ?, 0, 0)`).run(workspace, photos)

  const source = new LocalSource(photos)
  await scanProject({ db, projectId: 'p1', source })
  const stats = await preprocessProject({ db, projectId: 'p1', sourceRoot: photos, workspaceDir: workspace })

  const counts = Object.fromEntries(
    db.prepare('SELECT state, COUNT(*) AS n FROM photos WHERE project_id = ? GROUP BY state').all('p1')
      .map(row => [row.state, row.n]),
  )
  assert.equal(counts.filtered_dup, 1)
  assert.equal(counts.filtered_small, 1)
  assert.equal(counts.filtered_exposure, 1)
  assert.ok(counts.ok >= 2)
  assert.ok(stats.groups >= 1)

  const grouped = db.prepare("SELECT COUNT(*) AS n FROM photos WHERE group_id IS NOT NULL").get()
  assert.ok(grouped.n >= 2)
  const thumb = db.prepare("SELECT thumb_path FROM photos WHERE state = 'ok' LIMIT 1").get()
  assert.match(thumb.thumb_path, /^thumbs\/.+\.webp$/)
  db.close()
  rmSync(base, { recursive: true, force: true })
})
