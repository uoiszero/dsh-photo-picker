import { nanoid } from 'nanoid'
import exifr from 'exifr'

const EXIF_FIELDS = [
  'DateTimeOriginal', 'CreateDate', 'Make', 'Model', 'LensModel',
  'Orientation', 'ExifImageWidth', 'ExifImageHeight', 'ImageWidth', 'ImageHeight',
]

function toMs(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.getTime()
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

/** L0 扫描：把源目录里的照片写进 photos 表（不读取像素）。 */
export async function scanProject({ db, projectId, source, onProgress = () => {} }) {
  const stageId = nanoid()
  const now = Date.now()
  db.prepare(`INSERT INTO stage_runs (id, project_id, stage, status, started_at)
              VALUES (?, ?, 'scan', 'running', ?)`).run(stageId, projectId, now)

  const insert = db.prepare(`
    INSERT INTO photos (id, project_id, rel_path, size_bytes, mtime_ms, format,
                        width, height, orientation, taken_at, camera, lens, state, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ok', ?)
    ON CONFLICT(project_id, rel_path) DO UPDATE SET
      size_bytes = excluded.size_bytes,
      mtime_ms = excluded.mtime_ms,
      format = excluded.format,
      width = COALESCE(excluded.width, photos.width),
      height = COALESCE(excluded.height, photos.height),
      orientation = COALESCE(excluded.orientation, photos.orientation),
      taken_at = COALESCE(excluded.taken_at, photos.taken_at),
      camera = COALESCE(excluded.camera, photos.camera),
      lens = COALESCE(excluded.lens, photos.lens)
  `)

  let photos = 0
  let skipped = 0
  let errors = 0
  for await (const item of source.walk()) {
    if (item.format === undefined) {
      skipped += 1
      continue
    }
    try {
      const info = await source.stat(item.relPath)
      let exif = {}
      try {
        exif = await exifr.parse(source.absolute(item.relPath), { pick: EXIF_FIELDS }) ?? {}
      } catch {
        exif = {}
      }
      const width = exif.ExifImageWidth ?? exif.ImageWidth ?? null
      const height = exif.ExifImageHeight ?? exif.ImageHeight ?? null
      insert.run(
        nanoid(), projectId, item.relPath, info.size, info.mtimeMs, item.format,
        width, height, exif.Orientation ?? null,
        toMs(exif.DateTimeOriginal ?? exif.CreateDate),
        exif.Model ?? exif.Make ?? null, exif.LensModel ?? null, Date.now(),
      )
      photos += 1
      onProgress({ stage: 'scan', done: photos, total: null, relPath: item.relPath })
    } catch (error) {
      errors += 1
      db.prepare(`INSERT INTO errors (id, project_id, stage, code, message, created_at)
                  VALUES (?, ?, 'scan', 'SCAN_ITEM_FAILED', ?, ?)`)
        .run(nanoid(), projectId, String(error?.message ?? error), Date.now())
    }
  }

  const finished = Date.now()
  const stats = { photos, skipped, errors, durationMs: finished - now }
  db.prepare(`UPDATE stage_runs SET status = 'done', stats_json = ?, finished_at = ?
              WHERE id = ?`).run(JSON.stringify(stats), finished, stageId)
  db.prepare(`UPDATE projects SET status = 'scanned', updated_at = ? WHERE id = ?`)
    .run(finished, projectId)
  return stats
}
