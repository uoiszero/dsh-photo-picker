/** 跨项目照片墙查询：逐个打开项目库，合并后统一排序/分页。 */

import { listReviewPhotos } from './review.js'

const MAX_WALL_PAGE = 5000

function errorMessage(error) {
  return String(error?.message ?? error)
}

function projectIdSet(filters) {
  const values = Array.isArray(filters.projectIds) ? filters.projectIds : []
  return new Set(values.filter(value => typeof value === 'string' && value !== ''))
}

function compareItems(sort, left, right) {
  if (sort === 'score' || sort === 'score_asc') {
    const a = left.score === null ? Number.NaN : Number(left.score)
    const b = right.score === null ? Number.NaN : Number(right.score)
    const aMissing = Number.isNaN(a)
    const bMissing = Number.isNaN(b)
    if (aMissing !== bMissing) return aMissing ? 1 : -1
    if (!aMissing && a !== b) return sort === 'score' ? b - a : a - b
  } else if (sort === 'taken_at') {
    const a = Number(left.takenAt ?? 0)
    const b = Number(right.takenAt ?? 0)
    if (a !== b) return a - b
  }
  const projectCompare = String(left.projectName ?? '').localeCompare(String(right.projectName ?? ''))
  if (projectCompare !== 0) return projectCompare
  const pathCompare = String(left.relPath ?? '').localeCompare(String(right.relPath ?? ''))
  if (pathCompare !== 0) return pathCompare
  return String(left.projectId).localeCompare(String(right.projectId))
}

export async function listGlobalPhotos({ store, filters = {} }) {
  const limitValue = Number(filters.limit ?? 120)
  const offsetValue = Number(filters.offset ?? 0)
  const limit = Math.min(Math.max(Number.isFinite(limitValue) ? limitValue : 120, 1), 120)
  const offset = Math.max(Number.isFinite(offsetValue) ? offsetValue : 0, 0)
  if (offset + limit > MAX_WALL_PAGE) {
    const error = new Error(`wall page is too deep; narrow the filters (max ${MAX_WALL_PAGE} rows)`)
    error.code = 'WALL_PAGE_TOO_DEEP'
    error.statusCode = 400
    throw error
  }

  const projectIds = projectIdSet(filters)
  const entries = await store.list()
  const selectedProjects = entries.filter(entry => projectIds.size === 0 || projectIds.has(entry.id))
  const warnings = []
  for (const id of projectIds) {
    if (!entries.some(entry => entry.id === id)) warnings.push({ projectId: id, message: 'unknown project' })
  }

  const perProjectLimit = offset + limit
  const results = await Promise.all(selectedProjects.map(async entry => {
    try {
      const { db, project } = await store.open(entry.id)
      const page = listReviewPhotos(db, entry.id, {
        scenes: filters.scenes,
        verdicts: filters.verdicts,
        sort: filters.sort || 'score',
        limit: perProjectLimit,
        offset: 0,
        maxLimit: MAX_WALL_PAGE,
      })
      return {
        projectId: entry.id,
        projectName: project.name,
        projectUpdatedAt: project.updatedAt,
        total: page.total,
        items: page.items,
      }
    } catch (error) {
      warnings.push({ projectId: entry.id, message: errorMessage(error) })
      return { projectId: entry.id, projectName: entry.name, projectUpdatedAt: entry.updatedAt, total: 0, items: [] }
    }
  }))

  const total = results.reduce((sum, result) => sum + result.total, 0)
  const merged = []
  for (const result of results) {
    for (const item of result.items) {
      merged.push({
        ...item,
        projectId: result.projectId,
        projectName: result.projectName,
        projectUpdatedAt: result.projectUpdatedAt,
      })
    }
  }
  const sort = filters.sort || 'score'
  merged.sort((left, right) => compareItems(sort, left, right))
  return { total, items: merged.slice(offset, offset + limit), warnings }
}
