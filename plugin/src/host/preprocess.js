import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fromPortablePath } from './platform.js'
import { nanoid } from 'nanoid'
import { deriveImage, hammingHex } from './images.js'

const MIN_PIXELS = 2_000_000
const BLUR_MIN = 40
const MAX_GROUP_WINDOW_SECONDS = 120

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    createReadStream(filePath)
      .on('data', chunk => hash.update(chunk))
      .on('error', reject)
      .on('end', () => resolve(hash.digest('hex')))
  })
}

class UnionFind {
  constructor(size) {
    this.parent = Array.from({ length: size }, (_, i) => i)
    this.rank = new Array(size).fill(0)
  }
  find(x) {
    let root = x
    while (this.parent[root] !== root) root = this.parent[root]
    while (this.parent[x] !== x) {
      const next = this.parent[x]
      this.parent[x] = root
      x = next
    }
    return root
  }
  union(a, b) {
    const ra = this.find(a)
    const rb = this.find(b)
    if (ra === rb) return
    if (this.rank[ra] < this.rank[rb]) {
      this.parent[ra] = rb
    } else if (this.rank[ra] > this.rank[rb]) {
      this.parent[rb] = ra
    } else {
      this.parent[rb] = ra
      this.rank[ra] += 1
    }
  }
}

function recordError(db, projectId, code, message) {
  db.prepare(`INSERT INTO errors (id, project_id, stage, code, message, created_at)
              VALUES (?, ?, 'preprocess', ?, ?, ?)`)
    .run(nanoid(), projectId, code, message, Date.now())
}

/** L1 预处理：精确去重 → 解码派生 → 技术过滤 → 分组。 */
export async function preprocessProject({
  db, projectId, sourceRoot, workspaceDir,
  onProgress = () => {}, blurMin = BLUR_MIN, blurPercentile = 0.05,
}) {
  const stageId = nanoid()
  const startedAt = Date.now()
  db.prepare(`INSERT INTO stage_runs (id, project_id, stage, status, started_at)
              VALUES (?, ?, 'preprocess', 'running', ?)`).run(stageId, projectId, startedAt)

  await mkdir(path.join(workspaceDir, 'thumbs'), { recursive: true })

  const seen = new Map()
  for (const row of db.prepare('SELECT id, sha256 FROM photos WHERE project_id = ? AND sha256 IS NOT NULL').all(projectId)) {
    if (row.sha256 !== null) seen.set(row.sha256, row.id)
  }

  const pending = db.prepare(`
    SELECT id, rel_path FROM photos
    WHERE project_id = ? AND state = 'ok' AND dhash IS NULL
    ORDER BY rel_path
  `).all(projectId)

  let done = 0
  for (const row of pending) {
    const absolute = fromPortablePath(sourceRoot, row.rel_path)
    try {
      const sha = await sha256File(absolute)
      const duplicateOf = seen.get(sha)
      if (duplicateOf !== undefined) {
        db.prepare("UPDATE photos SET sha256 = ?, state = 'filtered_dup' WHERE id = ?").run(sha, row.id)
        done += 1
        onProgress({ stage: 'preprocess', phase: 'derive', done, total: pending.length })
        continue
      }
      seen.set(sha, row.id)
      const derived = await deriveImage(absolute)
      const thumbRel = `thumbs/${row.id}.webp`
      await writeFile(fromPortablePath(workspaceDir, thumbRel), derived.thumb)
      db.prepare(`
        UPDATE photos SET sha256 = ?, width = ?, height = ?, dhash = ?, blur_score = ?,
          clip_low = ?, clip_high = ?, thumb_path = ?
        WHERE id = ?
      `).run(sha, derived.width, derived.height, derived.dhash, derived.blurScore,
        derived.clipLow, derived.clipHigh, thumbRel, row.id)
    } catch (error) {
      const message = String(error?.message ?? error)
      db.prepare("UPDATE photos SET state = 'unreadable', error = ? WHERE id = ?").run(message, row.id)
      recordError(db, projectId, 'IMAGE_DECODE_FAILED', `${row.rel_path}: ${message}`)
    }
    done += 1
    onProgress({ stage: 'preprocess', phase: 'derive', done, total: pending.length })
  }

  const scored = db.prepare(`
    SELECT id, width, height, blur_score, clip_low, clip_high FROM photos
    WHERE project_id = ? AND state = 'ok' AND dhash IS NOT NULL
  `).all(projectId)
  const sortedScores = scored.map(row => row.blur_score).sort((a, b) => a - b)
  const p5 = sortedScores[Math.floor(sortedScores.length * blurPercentile)] ?? 0

  for (const row of scored) {
    const pixels = (row.width ?? 0) * (row.height ?? 0)
    let state = 'ok'
    if (pixels < MIN_PIXELS) state = 'filtered_small'
    else if ((row.clip_high ?? 0) > 0.4 || (row.clip_low ?? 0) > 0.6) state = 'filtered_exposure'
    else if (p5 > 0 && row.blur_score < blurMin && row.blur_score <= p5) state = 'filtered_blur'
    if (state !== 'ok') db.prepare('UPDATE photos SET state = ? WHERE id = ?').run(state, row.id)
  }

  db.prepare('DELETE FROM groups WHERE project_id = ?').run(projectId)
  db.prepare('UPDATE photos SET group_id = NULL WHERE project_id = ?').run(projectId)

  const survivors = db.prepare(`
    SELECT id, rel_path, taken_at, mtime_ms, dhash, blur_score FROM photos
    WHERE project_id = ? AND state = 'ok'
    ORDER BY COALESCE(taken_at, mtime_ms) ASC, rel_path ASC
  `).all(projectId)

  const uf = new UnionFind(survivors.length)
  const timeOf = row => Number(row.taken_at ?? row.mtime_ms ?? 0)
  for (let i = 0; i < survivors.length; i++) {
    for (let j = i + 1; j < survivors.length; j++) {
      const seconds = Math.abs(timeOf(survivors[j]) - timeOf(survivors[i])) / 1000
      if (seconds > MAX_GROUP_WINDOW_SECONDS) break
      const distance = hammingHex(survivors[i].dhash, survivors[j].dhash)
      const burst = seconds <= 2 && distance <= 12
      const scene = seconds <= 60 && distance <= 6
      if (burst || scene) uf.union(i, j)
    }
  }

  const buckets = new Map()
  survivors.forEach((row, index) => {
    const root = uf.find(index)
    const bucket = buckets.get(root) ?? []
    bucket.push({ ...row, index })
    buckets.set(root, bucket)
  })

  let groups = 0
  for (const members of buckets.values()) {
    if (members.length < 2) continue
    groups += 1
    const groupId = nanoid()
    const times = members.map(timeOf)
    const representative = [...members].sort((a, b) => (b.blur_score ?? 0) - (a.blur_score ?? 0))[0]
    const kind = Math.max(...times) - Math.min(...times) <= 2000 ? 'burst' : 'scene'
    db.prepare(`INSERT INTO groups (id, project_id, kind, representative_photo_id, size, started_at, ended_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(groupId, projectId, kind, representative.id, members.length, Math.min(...times), Math.max(...times))
    const update = db.prepare('UPDATE photos SET group_id = ? WHERE id = ?')
    for (const member of members) update.run(groupId, member.id)
  }

  const counts = Object.fromEntries(
    db.prepare('SELECT state, COUNT(*) AS n FROM photos WHERE project_id = ? GROUP BY state')
      .all(projectId).map(row => [row.state, row.n]),
  )
  const finishedAt = Date.now()
  const stats = { counts, groups, durationMs: finishedAt - startedAt }
  db.prepare(`UPDATE stage_runs SET status = 'done', stats_json = ?, finished_at = ?
              WHERE id = ?`).run(JSON.stringify(stats), finishedAt, stageId)
  db.prepare(`UPDATE projects SET status = 'preprocessed', updated_at = ? WHERE id = ?`)
    .run(finishedAt, projectId)
  return stats
}
