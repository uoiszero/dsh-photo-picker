import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { ProjectStore } from '../plugin/src/host/projects.js'
import { LocalSource } from '../plugin/src/host/source.js'
import { scanProject } from '../plugin/src/host/scan.js'
import { preprocessProject } from '../plugin/src/host/preprocess.js'
import { runGridStage, runRankStage, runScoreStage } from '../plugin/src/host/pipeline.js'
import { getPhotoDetail, listReviewPhotos } from '../plugin/src/host/review.js'
import { renderEditedFile } from '../plugin/src/host/edit.js'
import { runExport } from '../plugin/src/host/export.js'

const sourcePath = process.argv[2] ?? '/tmp/pp-fixtures'
const base = mkdtempSync(path.join(tmpdir(), 'pp-accept-edit-'))
const store = new ProjectStore({
  dshHome: path.join(base, 'dsh'),
  workspaceRoot: path.join(base, 'work'),
})

const created = await store.create({ source: { kind: 'local', path: sourcePath }, name: 'acceptance-edit' })
const { db } = await store.open(created.id)
const project = await store.get(created.id)
const source = new LocalSource(project.sourcePath)
await scanProject({ db, projectId: project.id, source })
await preprocessProject({
  db, projectId: project.id, sourceRoot: project.sourcePath, workspaceDir: project.workspaceDir,
})

const calls = { grid: 0, rank: 0, score: 0 }
const editRecipe = {
  version: 1,
  crop: { left: 0.2, top: 0.1, width: 0.6, height: 0.8 },
  rotate: 0,
  exposureEv: 0.2,
  contrast: 0,
  saturation: 0,
  sharpen: 0,
}

/** 假 LLM：评分返回带 edit_recipe，不发真实请求。 */
const llm = {
  async *stream(options) {
    const content = options.messages[0].content
    const text = content.map(block => block.text ?? '').join('')
    const hasImage = content.some(block => block.type === 'image')
    let reply
    if (hasImage && text.includes('网格图')) {
      calls.grid += 1
      reply = '["A1","B1"]'
    } else if (text.includes('同一场景或连拍')) {
      calls.rank += 1
      const count = Number(/共 (\d+) 张/.exec(text)?.[1] ?? 1)
      const labels = Array.from({ length: count }, (_, index) => String.fromCharCode(65 + index))
      reply = JSON.stringify({ order: labels, best: labels[0], reason: '排序' })
    } else if (hasImage && text.includes('六个维度')) {
      calls.score += 1
      reply = JSON.stringify({
        score: 8.1,
        dimensions: { composition: 8, light: 8, color: 8, technique: 8, post_potential: 8, moment: 8 },
        verdict: 'keep',
        post_processing: ['crop_right'],
        edit_recipe: editRecipe,
        reason: '验收样本',
      })
    } else throw new Error('unexpected prompt')
    yield { type: 'text-delta', index: 0, text: reply }
    yield { type: 'usage', usage: { inputTokens: 800, outputTokens: 100 } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  },
}
const attachments = {
  async saveImage({ data, mediaType }) {
    return { attachmentId: 'acceptance', mediaType, bytes: data.length, width: 1280, height: 960 }
  },
}
const thumbFor = photo => readFile(path.join(project.workspaceDir, photo.thumb_path)).catch(() => undefined)
const loadPhoto = photo => path.join(project.sourcePath, photo.rel_path)
const now = () => new Date(2026, 10, 13, 20, 0)

const grid = await runGridStage({
  db, projectId: project.id, project, workspaceDir: project.workspaceDir,
  llm, attachments, thumbFor, now,
})
console.log('grid', grid)
assert.ok(grid.selected > 0)
assert.equal(calls.grid, grid.grids)

const rank = await runRankStage({ db, projectId: project.id, project, llm, now })
console.log('rank', rank)
assert.equal(rank.paused, false)

const score = await runScoreStage({
  db, projectId: project.id, project, llm, attachments, loadPhoto, now,
})
console.log('score', score)
assert.ok(score.scored > 0)
assert.equal(calls.score, score.scored)

const keeps = listReviewPhotos(db, project.id, { verdict: 'keep' })
assert.ok(keeps.items.length > 0, 'acceptance needs at least one keep photo')
const photo = keeps.items[0]
const detail = getPhotoDetail(db, project.id, photo.id)
console.log('detail', { id: detail.id, verdict: detail.verdict, editRecipe: detail.editRecipe })
assert.ok(detail.editRecipe, 'scored photo must expose editRecipe')
assert.equal(detail.editRecipe.crop.left, 0.2)
assert.equal(detail.editRecipe.crop.width, 0.6)
assert.equal(detail.editRecipe.exposureEv, 0.2)

// 渲染编辑预览：源文件 sha256 不能变。
const sourcePathForPhoto = path.join(project.sourcePath, photo.relPath)
const sha256 = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex')
const before = sha256(sourcePathForPhoto)

const edited = await renderEditedFile({
  sourcePath: sourcePathForPhoto,
  recipe: detail.editRecipe,
  cachePath: path.join(project.workspaceDir, 'edits', `${photo.id}-accept.jpg`),
})
console.log('edited', edited)
assert.equal(edited.cached, false)
assert.ok(existsSync(edited.path))
const meta = await sharp(edited.path).metadata()
assert.equal(meta.format, 'jpeg')
assert.equal(meta.width, Math.round(detail.width * detail.editRecipe.crop.width))
assert.equal(sha256(sourcePathForPhoto), before, 'rendering must not modify the source')

// 导出编辑副本：强制 copy，输出 .jpg，manifest 记录配方。
const dest = path.join(base, 'export-edited')
const result = await runExport({
  db, project, dest, edit: 'recipe', mode: 'copy', buckets: ['keep'],
})
console.log('export', { counts: result.counts, edited: result.editedCount, failures: result.failureCount })
assert.equal(result.failureCount, 0)
assert.equal(result.edit, 'recipe')
assert.equal(result.mode, 'copy')
assert.ok(result.editedCount >= 1)
const editedItems = result.items.filter(item => item.edited === true)
assert.ok(editedItems.length >= 1)
for (const item of editedItems) {
  assert.equal(item.editEngine, 'sharp-v2')
  assert.ok(item.editRecipe)
  assert.ok(item.destPath.endsWith('.jpg'), `edited output must be .jpg: ${item.destPath}`)
  assert.ok(existsSync(item.destPath))
  assert.equal((await sharp(item.destPath).metadata()).format, 'jpeg')
}
assert.equal(sha256(sourcePathForPhoto), before, 'exporting must not modify the source')

const manifest = JSON.parse(readFileSync(path.join(dest, 'manifest.json'), 'utf8'))
assert.equal(manifest.edit, 'recipe')
assert.ok(manifest.editedCount >= 1)
const manifestItem = manifest.items.find(item => item.relPath === photo.relPath)
assert.ok(manifestItem, 'exported photo must be listed in the manifest')
assert.equal(manifestItem.edited, true)
assert.equal(manifestItem.editEngine, 'sharp-v2')
assert.deepEqual(manifestItem.editRecipe, detail.editRecipe)
assert.ok(manifestItem.destPath.endsWith('.jpg'))

const csv = readFileSync(path.join(dest, 'manifest.csv'), 'utf8')
assert.match(csv, /^rel_path,bucket,verdict,ai_score,group_id,reason,edited,edit_engine,dest_path/)
const csvRow = csv.split('\n').find(line => line.startsWith(`${photo.relPath},keep,`))
assert.ok(csvRow, 'edited photo must be listed in manifest.csv')
assert.ok(csvRow.includes(',true,sharp-v2,'), csvRow)

console.log('PASS', { photo: photo.relPath, edited: result.editedCount, manifest: result.manifestPath })
