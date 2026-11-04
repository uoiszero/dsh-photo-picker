import { createHash } from 'node:crypto'
import { copyFile, link, mkdir, stat, writeFile } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import { nanoid } from 'nanoid'

const BUCKETS = ['keep', 'maybe', 'reject']
const MODES = ['hardlink', 'copy']
const LAYOUTS = ['mirror', 'flat']

function httpError(message, code, statusCode = 400) {
  const error = new Error(message)
  error.code = code
  error.statusCode = statusCode
  return error
}

function normalizeOptions({ dest, buckets = ['keep', 'maybe'], mode = 'hardlink', layout = 'mirror' } = {}) {
  if (typeof dest !== 'string' || dest.trim() === '') throw httpError('dest is required', 'BAD_DEST')
  if (!path.isAbsolute(dest)) throw httpError(`dest must be an absolute path: ${dest}`, 'BAD_DEST')
  const resolved = path.resolve(dest)
  const bucketList = [...new Set(Array.isArray(buckets) ? buckets : [])].filter(bucket => BUCKETS.includes(bucket))
  if (bucketList.length === 0) throw httpError('buckets must include keep, maybe or reject', 'BAD_BUCKETS')
  if (!MODES.includes(mode)) throw httpError(`unsupported mode: ${mode}`, 'BAD_MODE')
  if (!LAYOUTS.includes(layout)) throw httpError(`unsupported layout: ${layout}`, 'BAD_LAYOUT')
  return { dest: resolved, buckets: bucketList, mode, layout }
}

function sourceOf(project) {
  const source = project.sourcePath ?? project.source_path
  if (typeof source !== 'string' || source === '') throw httpError('project source is missing', 'BAD_PROJECT', 500)
  return source
}

function assertDestOutsideSource(project, dest) {
  const source = path.resolve(sourceOf(project))
  if (dest === source || dest.startsWith(`${source}${path.sep}`)) {
    throw httpError('dest must not be inside the photo source directory', 'DEST_INSIDE_SOURCE')
  }
}

function selectPhotos(db, projectId) {
  return db.prepare(`
    SELECT p.id, p.rel_path, p.size_bytes, p.group_id,
           d.verdict AS human_verdict,
           a.score, a.verdict AS ai_verdict, a.reason,
           COALESCE(d.verdict, ai_d.verdict, a.verdict, 'maybe') AS verdict
    FROM photos p
    LEFT JOIN decisions d ON d.photo_id = p.id AND d.source = 'human'
    LEFT JOIN decisions ai_d ON ai_d.photo_id = p.id AND ai_d.source = 'ai'
    LEFT JOIN assessments a ON a.target_id = p.id AND a.target_kind = 'photo' AND a.stage = 'single'
    WHERE p.project_id = ? AND p.thumb_path IS NOT NULL
      AND p.state IN ('ok', 'grid_selected', 'grid_rejected', 'grid_error', 'scored', 'score_failed')
    ORDER BY p.rel_path
  `).all(projectId)
}

function selectedForBuckets(rows, buckets) {
  const wanted = new Set(buckets)
  return rows.filter(row => wanted.has(row.verdict))
}

function sha8(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 8)
}

function targetPathFor(item, options, usedFlat) {
  const relative = options.layout === 'flat' ? path.basename(item.rel_path) : item.rel_path
  let target = path.join(options.dest, item.verdict, relative)
  if (options.layout === 'flat' && usedFlat.has(target)) {
    const extension = path.extname(relative)
    const name = path.basename(relative, extension)
    target = path.join(path.dirname(target), `${name}__${sha8(item.rel_path)}${extension}`)
  }
  if (options.layout === 'flat') usedFlat.add(target)
  return target
}

async function fileSize(filePath) {
  try {
    return (await stat(filePath)).size
  } catch {
    return undefined
  }
}

async function volumeOf(filePath) {
  let current = filePath
  for (;;) {
    try {
      const info = await stat(current)
      return info.dev
    } catch {
      const parent = path.dirname(current)
      if (parent === current) return undefined
      current = parent
    }
  }
}

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    createReadStream(filePath)
      .on('data', chunk => hash.update(chunk))
      .on('error', reject)
      .on('end', () => resolve(hash.digest('hex')))
  })
}

async function sampleSources(project, items) {
  const sample = items.slice(0, 20)
  const records = []
  for (const item of sample) {
    const sourcePath = path.join(sourceOf(project), item.rel_path)
    const info = await stat(sourcePath)
    records.push({ relPath: item.rel_path, size: info.size, mtimeMs: info.mtimeMs, sha256: await sha256File(sourcePath) })
  }
  return records
}

async function verifySourcesUnchanged(project, records) {
  const changed = []
  for (const record of records) {
    const sourcePath = path.join(sourceOf(project), record.relPath)
    const info = await stat(sourcePath).catch(() => undefined)
    if (info === undefined || info.size !== record.size || info.mtimeMs !== record.mtimeMs
      || await sha256File(sourcePath) !== record.sha256) {
      changed.push(record.relPath)
    }
  }
  return changed
}

function csvField(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export async function previewExport({ db, project, dest, buckets, mode, layout }) {
  const options = normalizeOptions({ dest, buckets, mode, layout })
  assertDestOutsideSource(project, options.dest)
  const items = selectedForBuckets(selectPhotos(db, project.id), options.buckets)
  const usedFlat = new Set()
  const counts = Object.fromEntries(options.buckets.map(bucket => [bucket, 0]))
  const conflicts = []
  let skippedExisting = 0
  let totalBytes = 0
  for (const item of items) {
    counts[item.verdict] += 1
    const sourcePath = path.join(sourceOf(project), item.rel_path)
    const size = await fileSize(sourcePath)
    if (size === undefined) {
      conflicts.push({ relPath: item.rel_path, reason: 'source_missing' })
      continue
    }
    totalBytes += size
    const target = targetPathFor(item, options, usedFlat)
    const existing = await fileSize(target)
    if (existing === size) skippedExisting += 1
    else if (existing !== undefined) conflicts.push({ relPath: item.rel_path, destPath: target, reason: 'size_mismatch' })
  }
  const sourceDev = await volumeOf(sourceOf(project))
  const destDev = await volumeOf(options.dest)
  return {
    dest: options.dest,
    buckets: options.buckets,
    mode: options.mode,
    layout: options.layout,
    counts,
    total: items.length,
    totalBytes,
    skippedExisting,
    sameVolume: sourceDev !== undefined && sourceDev === destDev,
    conflictCount: conflicts.length,
    conflicts: conflicts.slice(0, 20),
  }
}

export async function runExport({ db, project, dest, buckets, mode, layout }) {
  const options = normalizeOptions({ dest, buckets, mode, layout })
  assertDestOutsideSource(project, options.dest)
  const items = selectedForBuckets(selectPhotos(db, project.id), options.buckets)
  const before = await sampleSources(project, items)

  await mkdir(options.dest, { recursive: true })
  for (const bucket of options.buckets) await mkdir(path.join(options.dest, bucket), { recursive: true })

  const usedFlat = new Set()
  const counts = Object.fromEntries(options.buckets.map(bucket => [bucket, 0]))
  const skipped = []
  const failures = []
  const manifestItems = []

  for (const item of items) {
    const sourcePath = path.join(sourceOf(project), item.rel_path)
    const size = await fileSize(sourcePath)
    if (size === undefined) {
      failures.push({ relPath: item.rel_path, reason: 'source_missing' })
      continue
    }
    const target = targetPathFor(item, options, usedFlat)
    const existing = await fileSize(target)
    if (existing === size) {
      skipped.push({ relPath: item.rel_path, destPath: target })
      counts[item.verdict] += 1
      manifestItems.push({ ...item, destPath: target, action: 'skipped' })
      continue
    }
    if (existing !== undefined) {
      failures.push({ relPath: item.rel_path, destPath: target, reason: 'size_mismatch' })
      continue
    }
    try {
      await mkdir(path.dirname(target), { recursive: true })
      if (options.mode === 'copy') {
        await copyFile(sourcePath, target)
      } else {
        try {
          await link(sourcePath, target)
        } catch (error) {
          if (error?.code !== 'EXDEV') throw error
          await copyFile(sourcePath, target)
        }
      }
      counts[item.verdict] += 1
      manifestItems.push({ ...item, destPath: target, action: 'written' })
    } catch (error) {
      failures.push({ relPath: item.rel_path, destPath: target, reason: String(error?.message ?? error) })
    }
  }

  const changed = await verifySourcesUnchanged(project, before)
  const exportId = nanoid()
  const createdAt = Date.now()
  if (changed.length > 0) {
    db.prepare(`INSERT INTO exports (id, project_id, dest, mode, buckets_json, counts_json,
        manifest_path, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'failed', ?)`)
      .run(exportId, project.id, options.dest, options.mode, JSON.stringify(options.buckets),
        JSON.stringify({ counts, skipped: skipped.length, failures: failures.length, changedSources: changed }),
        null, createdAt)
    throw httpError(`source files changed during export: ${changed.slice(0, 5).join(', ')}`, 'SOURCE_MODIFIED', 500)
  }

  const csvHeader = 'rel_path,bucket,verdict,ai_score,group_id,reason,dest_path\n'
  const csvRows = manifestItems.map(item => [
    item.rel_path, item.verdict, item.human_verdict ?? item.ai_verdict ?? item.verdict,
    item.score ?? '', item.group_id ?? '', item.reason ?? '', item.destPath,
  ].map(csvField).join(','))
  const manifestPath = path.join(options.dest, 'manifest.csv')
  await writeFile(manifestPath, csvHeader + csvRows.join('\n') + (csvRows.length > 0 ? '\n' : ''), 'utf8')
  await writeFile(path.join(options.dest, 'manifest.json'), JSON.stringify({
    project: { id: project.id, name: project.name },
    dest: options.dest,
    mode: options.mode,
    layout: options.layout,
    buckets: options.buckets,
    counts,
    createdAt,
    items: manifestItems.map(item => ({
      relPath: item.rel_path,
      bucket: item.verdict,
      score: item.score ?? null,
      groupId: item.group_id ?? null,
      reason: item.reason ?? null,
      destPath: item.destPath,
      action: item.action,
    })),
  }, null, 2), 'utf8')

  db.prepare(`INSERT INTO exports (id, project_id, dest, mode, buckets_json, counts_json,
      manifest_path, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'done', ?)`)
    .run(exportId, project.id, options.dest, options.mode, JSON.stringify(options.buckets),
      JSON.stringify({ counts, skipped: skipped.length, failures: failures.length }),
      manifestPath, createdAt)

  return {
    id: exportId,
    dest: options.dest,
    counts,
    total: manifestItems.length,
    skipped: skipped.length,
    failures: failures.slice(0, 20),
    failureCount: failures.length,
    manifestPath,
    verifiedSources: before.length,
  }
}
