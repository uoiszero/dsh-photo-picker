import { nanoid } from 'nanoid'

const VERDICTS = new Set(['keep', 'maybe', 'reject'])

function round3(value) {
  return Math.round(value * 1000) / 1000
}

function ratio(numerator, denominator) {
  return denominator === 0 ? 0 : numerator / denominator
}

function f1Of(tp, fp, fn) {
  const precision = ratio(tp, tp + fp)
  const recall = ratio(tp, tp + fn)
  return precision + recall === 0 ? 0 : 2 * precision * recall / (precision + recall)
}

function shuffle(items, random) {
  for (let index = items.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1))
    const current = items[index]
    items[index] = items[swap]
    items[swap] = current
  }
  return items
}

/**
 * 按拍摄时间分层随机抽样，返回不含 AI 分数/判定的盲评样本（spec 8.5）。
 */
export function sampleCalibration(db, projectId, { size = 80, random = Math.random } = {}) {
  const rows = db.prepare(`
    SELECT p.id, p.rel_path, p.taken_at, p.mtime_ms, a.score, a.verdict
    FROM photos p
    JOIN assessments a
      ON a.target_id = p.id AND a.target_kind = 'photo' AND a.stage = 'single'
    WHERE p.project_id = ? AND p.thumb_path IS NOT NULL AND a.score IS NOT NULL
    ORDER BY COALESCE(p.taken_at, p.mtime_ms) ASC, p.rel_path ASC
  `).all(projectId)
  if (rows.length === 0) return { items: [], requested: size, available: 0 }
  const target = Math.max(1, Math.min(size, rows.length))
  const picked = []
  for (let index = 0; index < target; index++) {
    const start = Math.floor(index * rows.length / target)
    const end = Math.max(start + 1, Math.floor((index + 1) * rows.length / target))
    picked.push(rows[start + Math.floor(random() * (end - start))])
  }
  shuffle(picked, random)
  return {
    requested: size,
    available: rows.length,
    items: picked.map(row => ({
      id: row.id,
      relPath: row.rel_path,
      thumbUrl: `/photo-picker/media/thumb/${projectId}/${row.id}`,
      previewUrl: `/photo-picker/media/preview/${projectId}/${row.id}`,
    })),
  }
}

/** 用人工标签与已入库 AI 评分/判定计算精确率、召回率、F1、一致率与建议阈值。 */
export function computeCalibration(db, projectId, labels) {
  const valid = new Map()
  for (const entry of labels ?? []) {
    if (typeof entry?.photoId !== 'string') continue
    if (!VERDICTS.has(entry.verdict)) continue
    valid.set(entry.photoId, entry.verdict)
  }
  const ids = [...valid.keys()]
  if (ids.length === 0) {
    const error = new Error('calibration needs at least one labelled photo')
    error.code = 'BAD_CALIBRATION'
    error.statusCode = 400
    throw error
  }
  const placeholders = ids.map(() => '?').join(', ')
  const rows = db.prepare(`
    SELECT p.id, a.score, a.verdict AS ai_verdict
    FROM photos p
    JOIN assessments a
      ON a.target_id = p.id AND a.target_kind = 'photo' AND a.stage = 'single'
    WHERE p.project_id = ? AND p.id IN (${placeholders})
  `).all(projectId, ...ids)
  const data = rows
    .filter(row => row.ai_verdict !== null && row.score !== null)
    .map(row => ({ id: row.id, human: valid.get(row.id), ai: row.ai_verdict, score: Number(row.score) }))
  if (data.length === 0) {
    const error = new Error('no scored photos matched the calibration labels')
    error.code = 'BAD_CALIBRATION'
    error.statusCode = 400
    throw error
  }

  let tp = 0
  let fp = 0
  let fn = 0
  let agreed = 0
  const confusion = {
    keep: { keep: 0, maybe: 0, reject: 0 },
    maybe: { keep: 0, maybe: 0, reject: 0 },
    reject: { keep: 0, maybe: 0, reject: 0 },
  }
  for (const item of data) {
    if (item.ai === item.human) agreed += 1
    confusion[item.human][item.ai] += 1
    if (item.ai === 'keep' && item.human === 'keep') tp += 1
    else if (item.ai === 'keep') fp += 1
    else if (item.human === 'keep') fn += 1
  }
  const precision = ratio(tp, tp + fp)
  const recall = ratio(tp, tp + fn)
  const f1 = precision + recall === 0 ? 0 : 2 * precision * recall / (precision + recall)

  const curve = []
  let suggestedKeep = 7.5
  let bestF1 = -1
  for (let step = 0; step <= 100; step++) {
    const threshold = step / 10
    let curveTp = 0
    let curveFp = 0
    let curveFn = 0
    for (const item of data) {
      const predicted = item.score >= threshold
      if (predicted && item.human === 'keep') curveTp += 1
      else if (predicted) curveFp += 1
      else if (item.human === 'keep') curveFn += 1
    }
    const curveF1 = f1Of(curveTp, curveFp, curveFn)
    curve.push({ threshold, precision: round3(ratio(curveTp, curveTp + curveFp)), recall: round3(ratio(curveTp, curveTp + curveFn)), f1: round3(curveF1) })
    if (curveF1 > bestF1 || (curveF1 === bestF1 && threshold > suggestedKeep)) {
      bestF1 = curveF1
      suggestedKeep = threshold
    }
  }

  return {
    sampleSize: data.length,
    keep: { precision: round3(precision), recall: round3(recall), f1: round3(f1), tp, fp, fn },
    agreement: round3(agreed / data.length),
    confusion,
    thresholdCurve: curve,
    suggestedKeep: round3(suggestedKeep),
    suggestedMaybe: round3(Math.max(0, Math.min(suggestedKeep, suggestedKeep - 1.5))),
    labelled: data.map(item => ({ photoId: item.id, human: item.human, ai: item.ai, score: item.score })),
  }
}

export function saveCalibrationReport(db, projectId, report) {
  const id = nanoid()
  db.prepare(`INSERT INTO calibration_reports (id, project_id, sample_size, metrics_json,
      suggested_threshold, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, projectId, report.sampleSize, JSON.stringify(report), report.suggestedKeep, Date.now())
  return { id, ...report }
}

export function lastCalibrationReport(db, projectId) {
  const row = db.prepare(`SELECT * FROM calibration_reports WHERE project_id = ?
    ORDER BY created_at DESC LIMIT 1`).get(projectId)
  if (row === undefined) return null
  let metrics = null
  try { metrics = JSON.parse(row.metrics_json) } catch { metrics = null }
  return {
    id: row.id,
    sampleSize: row.sample_size,
    suggestedThreshold: row.suggested_threshold,
    createdAt: row.created_at,
    metrics,
  }
}
