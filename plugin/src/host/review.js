/** 复核查询：最终判定 = 人类决策 > AI 判定 > 默认 maybe（spec 7.7）。 */

const REVIEW_STATES = ['scored', 'grid_selected', 'grid_error', 'score_failed', 'ok']
const VERDICTS = new Set(['keep', 'maybe', 'reject'])

const BASE_FROM = `
  FROM photos p
  LEFT JOIN decisions d ON d.photo_id = p.id AND d.source = 'human'
  LEFT JOIN decisions ai_d ON ai_d.photo_id = p.id AND ai_d.source = 'ai'
  LEFT JOIN assessments a
    ON a.target_id = p.id AND a.target_kind = 'photo' AND a.stage = 'single'
  WHERE p.project_id = ? AND p.thumb_path IS NOT NULL
`

const VERDICT_SQL = "COALESCE(d.verdict, ai_d.verdict, a.verdict, 'maybe')"
const SORTS = {
  score: 'a.score IS NULL, a.score DESC, p.rel_path ASC',
  score_asc: 'a.score IS NULL, a.score ASC, p.rel_path ASC',
  taken_at: 'COALESCE(p.taken_at, p.mtime_ms) ASC, p.rel_path ASC',
  rel_path: 'p.rel_path ASC',
  group: 'p.group_id IS NULL, p.group_id, COALESCE(p.taken_at, p.mtime_ms), p.rel_path',
}

export function assertVerdict(verdict) {
  if (verdict === 'auto') return
  if (!VERDICTS.has(verdict)) {
    const error = new Error(`unsupported verdict: ${verdict}`)
    error.code = 'BAD_VERDICT'
    error.statusCode = 400
    throw error
  }
}

function parseJson(text) {
  if (text === null || text === undefined) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function toReviewPhoto(row, projectId) {
  return {
    id: row.id,
    relPath: row.rel_path,
    state: row.state,
    width: row.width,
    height: row.height,
    takenAt: row.taken_at,
    groupId: row.group_id,
    score: row.score ?? null,
    aiVerdict: row.ai_verdict ?? null,
    humanVerdict: row.human_verdict ?? null,
    verdict: row.verdict,
    reason: row.reason ?? null,
    dimensions: parseJson(row.dimensions_json),
    postProcessing: parseJson(row.post_processing_json) ?? [],
    thumbUrl: `/photo-picker/media/thumb/${projectId}/${row.id}`,
    previewUrl: `/photo-picker/media/preview/${projectId}/${row.id}`,
  }
}

function buildWhere(projectId, opts = {}) {
  const clauses = []
  const params = [projectId]
  const scope = opts.scope ?? 'review'
  if (scope === 'review') {
    clauses.push(`p.state IN (${REVIEW_STATES.map(() => '?').join(', ')})`)
    params.push(...REVIEW_STATES)
  }
  if (opts.state !== undefined) {
    clauses.push('p.state = ?')
    params.push(opts.state)
  }
  if (opts.verdict !== undefined) {
    clauses.push(`${VERDICT_SQL} = ?`)
    params.push(opts.verdict)
  }
  if (opts.groupId !== undefined) {
    clauses.push('p.group_id = ?')
    params.push(opts.groupId)
  }
  if (opts.scoreMin !== undefined) {
    clauses.push('a.score >= ?')
    params.push(opts.scoreMin)
  }
  if (opts.scoreMax !== undefined) {
    clauses.push('a.score <= ?')
    params.push(opts.scoreMax)
  }
  return { clauses, params }
}

export function listReviewPhotos(db, projectId, opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit ?? 60), 1), 500)
  const offset = Math.max(Number(opts.offset ?? 0), 0)
  const { clauses, params } = buildWhere(projectId, opts)
  const where = clauses.length > 0 ? ` AND ${clauses.join(' AND ')}` : ''
  const order = SORTS[opts.sort ?? 'score'] ?? SORTS.score
  const total = db.prepare(`SELECT COUNT(*) AS n ${BASE_FROM}${where}`).get(...params).n
  const rows = db.prepare(`
    SELECT p.id, p.rel_path, p.state, p.width, p.height, p.taken_at, p.group_id,
           d.verdict AS human_verdict,
           a.score, a.verdict AS ai_verdict, a.reason, a.dimensions_json, a.post_processing_json,
           ${VERDICT_SQL} AS verdict
    ${BASE_FROM}${where}
    ORDER BY ${order}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset)
  return { total, items: rows.map(row => toReviewPhoto(row, projectId)) }
}

export function getPhotoDetail(db, projectId, photoId) {
  const row = db.prepare(`
    SELECT p.id, p.rel_path, p.state, p.width, p.height, p.taken_at, p.group_id, p.camera, p.lens,
           d.verdict AS human_verdict,
           a.score, a.verdict AS ai_verdict, a.reason, a.dimensions_json, a.post_processing_json,
           ${VERDICT_SQL} AS verdict
    ${BASE_FROM} AND p.id = ?
  `).get(projectId, photoId)
  if (row === undefined) {
    const error = new Error(`unknown photo: ${photoId}`)
    error.code = 'NOT_FOUND'
    error.statusCode = 404
    throw error
  }
  const photo = {
    ...toReviewPhoto(row, projectId),
    camera: row.camera ?? null,
    lens: row.lens ?? null,
  }
  if (row.group_id !== null) {
    const members = db.prepare(`
      SELECT p.id, p.rel_path, a.score FROM photos p
      LEFT JOIN assessments a ON a.target_id = p.id AND a.target_kind = 'photo' AND a.stage = 'single'
      WHERE p.project_id = ? AND p.group_id = ? AND p.thumb_path IS NOT NULL
      ORDER BY a.score IS NULL, a.score DESC, p.rel_path
    `).all(projectId, row.group_id)
    photo.group = {
      id: row.group_id,
      size: members.length,
      rank: Math.max(1, members.findIndex(member => member.id === photoId) + 1),
      members: members.map(member => ({
        id: member.id,
        relPath: member.rel_path,
        score: member.score ?? null,
        thumbUrl: `/photo-picker/media/thumb/${projectId}/${member.id}`,
      })),
    }
  }
  return photo
}

export function listGroups(db, projectId, { limit = 100, offset = 0 } = {}) {
  const total = db.prepare('SELECT COUNT(*) AS n FROM groups WHERE project_id = ?').get(projectId).n
  const groups = db.prepare(`
    SELECT g.id, g.kind, g.started_at, g.ended_at,
      (SELECT COUNT(*) FROM photos p
       WHERE p.project_id = g.project_id AND p.group_id = g.id AND p.thumb_path IS NOT NULL) AS members
    FROM groups g
    WHERE g.project_id = ?
    ORDER BY COALESCE(g.started_at, 0), g.id
    LIMIT ? OFFSET ?
  `).all(projectId, Math.min(Math.max(Number(limit), 1), 500), Math.max(Number(offset), 0))
  return {
    total,
    items: groups.map(group => {
      const thumbs = db.prepare(`
        SELECT id FROM photos WHERE project_id = ? AND group_id = ? AND thumb_path IS NOT NULL
        ORDER BY COALESCE(taken_at, mtime_ms), rel_path LIMIT 4
      `).all(projectId, group.id)
      return {
        id: group.id,
        kind: group.kind,
        size: group.members,
        startedAt: group.started_at,
        endedAt: group.ended_at,
        memberIds: thumbs.map(row => row.id),
        thumbUrls: thumbs.map(row => `/photo-picker/media/thumb/${projectId}/${row.id}`),
      }
    }),
  }
}

export function groupDetail(db, projectId, groupId) {
  const group = db.prepare('SELECT * FROM groups WHERE project_id = ? AND id = ?').get(projectId, groupId)
  if (group === undefined) {
    const error = new Error(`unknown group: ${groupId}`)
    error.code = 'NOT_FOUND'
    error.statusCode = 404
    throw error
  }
  const members = db.prepare(`
    SELECT p.id, p.rel_path, p.state, p.taken_at,
           d.verdict AS human_verdict,
           a.score, a.verdict AS ai_verdict, a.reason,
           ${VERDICT_SQL} AS verdict
    FROM photos p
    LEFT JOIN decisions d ON d.photo_id = p.id AND d.source = 'human'
    LEFT JOIN decisions ai_d ON ai_d.photo_id = p.id AND ai_d.source = 'ai'
    LEFT JOIN assessments a ON a.target_id = p.id AND a.target_kind = 'photo' AND a.stage = 'single'
    WHERE p.project_id = ? AND p.group_id = ? AND p.thumb_path IS NOT NULL
    ORDER BY a.score IS NULL, a.score DESC, p.rel_path
  `).all(projectId, groupId)
  return {
    id: group.id,
    kind: group.kind,
    size: members.length,
    startedAt: group.started_at,
    endedAt: group.ended_at,
    members: members.map(row => ({
      ...toReviewPhoto(row, projectId),
      dimensions: null,
      postProcessing: [],
    })),
  }
}

export function setHumanDecisions(db, projectId, photoIds, verdict) {
  assertVerdict(verdict)
  const ids = [...new Set(Array.isArray(photoIds) ? photoIds.filter(id => typeof id === 'string') : [])]
  if (ids.length === 0) return { updated: [] }
  const placeholders = ids.map(() => '?').join(', ')
  const owned = new Set(
    db.prepare(`SELECT id FROM photos WHERE project_id = ? AND id IN (${placeholders})`)
      .all(projectId, ...ids).map(row => row.id),
  )
  const clear = verdict === 'auto'
  const upsert = db.prepare(`
    INSERT INTO decisions (photo_id, project_id, verdict, source, updated_at)
    VALUES (?, ?, ?, 'human', ?)
    ON CONFLICT(photo_id) DO UPDATE SET
      verdict = excluded.verdict,
      source = 'human',
      updated_at = excluded.updated_at
  `)
  const remove = db.prepare("DELETE FROM decisions WHERE photo_id = ? AND source = 'human'")
  const now = Date.now()
  const updated = []
  for (const id of ids) {
    if (!owned.has(id)) continue
    if (clear) remove.run(id)
    else upsert.run(id, projectId, verdict, now)
    updated.push({ photoId: id, verdict: clear ? null : verdict })
  }
  return { updated }
}

export function projectStats(db, projectId) {
  const verdicts = Object.fromEntries(
    db.prepare(`
      SELECT ${VERDICT_SQL} AS verdict, COUNT(*) AS n
      ${BASE_FROM}
        AND p.state IN ('ok', 'grid_selected', 'grid_rejected', 'grid_error', 'scored', 'score_failed')
      GROUP BY 1
    `).all(projectId).map(row => [row.verdict, row.n]),
  )
  const states = Object.fromEntries(
    db.prepare('SELECT state, COUNT(*) AS n FROM photos WHERE project_id = ? GROUP BY state')
      .all(projectId).map(row => [row.state, row.n]),
  )
  const histogram = Array.from({ length: 11 }, (_, bucket) => ({ bucket, count: 0 }))
  for (const row of db.prepare(`
    SELECT CAST(MIN(10, MAX(0, score)) AS INTEGER) AS bucket, COUNT(*) AS n
    FROM assessments
    WHERE project_id = ? AND stage = 'single' AND score IS NOT NULL
    GROUP BY bucket
  `).all(projectId)) {
    histogram[row.bucket].count = row.n
  }
  return { verdicts, states, histogram }
}
