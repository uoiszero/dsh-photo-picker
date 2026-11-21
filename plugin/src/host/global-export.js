/** 跨项目导出：复用单项目导出的源校验、manifest 与配方渲染，按项目分目录写出。 */

import { copyFile, link, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { slugify } from './paths.js'
import { EDIT_ENGINE, renderEditedBuffer } from './edit.js'
import {
  assertDestOutsideSource, csvField, fileSize, primarySceneOf, recipeOf,
  sampleSources, scenesOf, selectPhotos, sha8, sourceOf, verifySourcesUnchanged,
} from './export.js'

const BUCKETS = ['keep', 'maybe', 'reject']
const LAYOUTS = ['project', 'flat']
const MODES = ['hardlink', 'copy']
const EDIT_MODES = ['none', 'recipe']

function httpError(message, code, statusCode = 400) {
  const error = new Error(message)
  error.code = code
  error.statusCode = statusCode
  return error
}

function normalizeOptions({ dest, buckets = ['keep', 'maybe'], layout = 'project', mode = 'hardlink', edit = 'none' } = {}) {
  if (typeof dest !== 'string' || dest.trim() === '') throw httpError('dest is required', 'BAD_DEST')
  if (!path.isAbsolute(dest)) throw httpError(`dest must be an absolute path: ${dest}`, 'BAD_DEST')
  const bucketList = [...new Set(Array.isArray(buckets) ? buckets : [])].filter(bucket => BUCKETS.includes(bucket))
  if (bucketList.length === 0) throw httpError('buckets must include keep, maybe or reject', 'BAD_BUCKETS')
  if (!LAYOUTS.includes(layout)) throw httpError(`unsupported layout: ${layout}`, 'BAD_LAYOUT')
  if (!MODES.includes(mode)) throw httpError(`unsupported mode: ${mode}`, 'BAD_MODE')
  if (!EDIT_MODES.includes(edit)) throw httpError(`unsupported edit mode: ${edit}`, 'BAD_EDIT')
  if (edit === 'recipe') mode = 'copy'
  return { dest: path.resolve(dest), buckets: bucketList, layout, mode, edit }
}

function projectFolder(project) {
  return `${slugify(project.name)}-${project.id.slice(0, 6)}`
}

function relativeWithJpg(relPath) {
  const extension = path.extname(relPath)
  return `${relPath.slice(0, extension === '' ? relPath.length : -extension.length)}.jpg`
}

function targetPathFor(item, options, usedFlat, edited = false) {
  const relative = edited ? relativeWithJpg(item.rel_path) : item.rel_path
  let target
  if (options.layout === 'project') {
    target = path.join(options.dest, projectFolder(item.project), item.verdict, relative)
  } else {
    target = path.join(options.dest, item.verdict, path.basename(relative))
    if (usedFlat.has(target)) {
      const extension = path.extname(target)
      const name = path.basename(target, extension)
      target = path.join(path.dirname(target), `${name}__${item.project.id.slice(0, 6)}${extension}`)
    }
    if (usedFlat.has(target)) {
      const extension = path.extname(target)
      const name = path.basename(target, extension)
      target = path.join(path.dirname(target), `${name}__${sha8(`${item.project.id}/${item.rel_path}`)}${extension}`)
    }
    usedFlat.add(target)
  }
  return target
}

function matches(item, { scenes, verdicts, buckets }) {
  if (Array.isArray(buckets) && buckets.length > 0 && !buckets.includes(item.verdict)) return false
  const wantedVerdicts = Array.isArray(verdicts) ? verdicts.filter(value => BUCKETS.includes(value)) : []
  if (wantedVerdicts.length > 0 && !wantedVerdicts.includes(item.verdict)) return false
  const wantedScenes = Array.isArray(scenes) ? scenes.filter(value => typeof value === 'string' && value !== '') : []
  if (wantedScenes.length === 0) return true
  const itemScenes = scenesOf(item)
  return wantedScenes.some(scene => itemScenes.includes(scene))
}

async function loadItems(store, { projectIds, scenes, verdicts, buckets, items }) {
  const entries = await store.list()
  const wanted = Array.isArray(projectIds) && projectIds.length > 0 ? new Set(projectIds) : null
  const selected = Array.isArray(items) && items.length > 0
  const selectedByProject = new Map()
  if (selected) {
    for (const item of items) {
      if (typeof item?.projectId !== 'string' || typeof item?.photoId !== 'string') continue
      const list = selectedByProject.get(item.projectId) ?? new Set()
      list.add(item.photoId)
      selectedByProject.set(item.projectId, list)
    }
  }

  const warnings = []
  const projects = entries.filter(entry => wanted === null || wanted.has(entry.id))
  const loaded = await Promise.all(projects.map(async entry => {
    try {
      const { db, project } = await store.open(entry.id)
      const rows = selectPhotos(db, entry.id)
      const ids = selectedByProject.get(entry.id)
      return rows
        .filter(row => selected ? ids?.has(row.id) === true : matches(row, { scenes, verdicts, buckets }))
        .map(row => ({ ...row, project }))
    } catch (error) {
      warnings.push({ projectId: entry.id, message: String(error?.message ?? error) })
      return []
    }
  }))

  const all = loaded.flat().sort((left, right) => {
    const project = left.project.name.localeCompare(right.project.name)
    return project !== 0 ? project : left.rel_path.localeCompare(right.rel_path)
  })
  return { items: all, warnings }
}

function assertUniqueProjects(items) {
  const projects = new Map()
  for (const item of items) projects.set(item.project.id, item.project)
  return [...projects.values()]
}

function emptyResult(dest, options) {
  return {
    dest, buckets: options.buckets, layout: options.layout, mode: options.mode, edit: options.edit,
    total: 0, counts: Object.fromEntries(options.buckets.map(bucket => [bucket, 0])),
    byProject: {}, totalBytes: 0, skippedExisting: 0, editedCount: 0, conflicts: [],
  }
}

export async function previewGlobalExport({ store, ...input }) {
  const options = normalizeOptions(input)
  const { items, warnings } = await loadItems(store, input)
  if (items.length === 0) throw httpError('no photos match the export selection', 'NO_PHOTOS')
  const projects = assertUniqueProjects(items)
  for (const project of projects) assertDestOutsideSource(project, options.dest)

  const usedFlat = new Set()
  const counts = Object.fromEntries(options.buckets.map(bucket => [bucket, 0]))
  const byProject = {}
  const conflicts = []
  let skippedExisting = 0
  let editedCount = 0
  let totalBytes = 0
  for (const item of items) {
    counts[item.verdict] = (counts[item.verdict] ?? 0) + 1
    const projectKey = item.project.id
    byProject[projectKey] ??= { projectId: projectKey, projectName: item.project.name, total: 0 }
    byProject[projectKey].total += 1
    const sourcePath = path.join(sourceOf(item.project), item.rel_path)
    const size = await fileSize(sourcePath)
    if (size === undefined) {
      conflicts.push({ projectId: projectKey, relPath: item.rel_path, reason: 'source_missing' })
      continue
    }
    totalBytes += size
    if (options.edit === 'recipe' && recipeOf(item) !== null) editedCount += 1
    if (options.edit === 'recipe') continue
    const target = targetPathFor(item, options, usedFlat)
    const existing = await fileSize(target)
    if (existing === size) skippedExisting += 1
    else if (existing !== undefined) conflicts.push({ projectId: projectKey, relPath: item.rel_path, destPath: target, reason: 'size_mismatch' })
  }
  return {
    ...emptyResult(options.dest, options),
    total: items.length,
    counts,
    byProject,
    totalBytes,
    skippedExisting,
    editedCount,
    conflicts,
    conflictCount: conflicts.length,
    warnings,
  }
}

export async function runGlobalExport({ store, ...input }) {
  const options = normalizeOptions(input)
  const { items, warnings } = await loadItems(store, input)
  if (items.length === 0) throw httpError('no photos match the export selection', 'NO_PHOTOS')
  const projects = assertUniqueProjects(items)
  for (const project of projects) assertDestOutsideSource(project, options.dest)

  const before = []
  for (const project of projects) {
    const projectItems = items.filter(item => item.project.id === project.id)
    before.push({ project, records: await sampleSources(project, projectItems) })
  }

  await mkdir(options.dest, { recursive: true })
  for (const bucket of options.buckets) await mkdir(path.join(options.dest, bucket), { recursive: true })

  const usedFlat = new Set()
  const counts = Object.fromEntries(options.buckets.map(bucket => [bucket, 0]))
  const byProject = {}
  const failures = []
  const skipped = []
  const manifestItems = []
  let editedCount = 0

  for (const item of items) {
    const sourcePath = path.join(sourceOf(item.project), item.rel_path)
    const size = await fileSize(sourcePath)
    if (size === undefined) {
      failures.push({ projectId: item.project.id, relPath: item.rel_path, reason: 'source_missing' })
      continue
    }
    const recipe = options.edit === 'recipe' ? recipeOf(item) : null
    const target = targetPathFor(item, options, usedFlat, recipe !== null)
    const bucket = item.verdict
    let buffer = null
    if (recipe !== null) {
      try {
        buffer = await renderEditedBuffer({ sourcePath, recipe })
      } catch (error) {
        failures.push({ projectId: item.project.id, relPath: item.rel_path, reason: `edit_failed: ${String(error?.message ?? error)}` })
        continue
      }
    }
    const existing = await fileSize(target)
    if (existing !== undefined && (buffer !== null ? existing === buffer.length : existing === size)) {
      skipped.push({ projectId: item.project.id, relPath: item.rel_path, destPath: target })
      counts[bucket] = (counts[bucket] ?? 0) + 1
      byProject[item.project.id] ??= { projectId: item.project.id, projectName: item.project.name, total: 0 }
      byProject[item.project.id].total += 1
      manifestItems.push({
        ...item, destPath: target, action: 'skipped', edited: buffer !== null, editEngine: buffer !== null ? EDIT_ENGINE : null, editRecipe: recipe,
      })
      continue
    }
    if (existing !== undefined) {
      failures.push({ projectId: item.project.id, relPath: item.rel_path, destPath: target, reason: 'size_mismatch' })
      continue
    }
    try {
      await mkdir(path.dirname(target), { recursive: true })
      if (buffer !== null) await writeFile(target, buffer)
      else if (options.mode === 'copy') await copyFile(sourcePath, target)
      else {
        try { await link(sourcePath, target) } catch (error) {
          if (error?.code !== 'EXDEV') throw error
          await copyFile(sourcePath, target)
        }
      }
      counts[bucket] = (counts[bucket] ?? 0) + 1
      byProject[item.project.id] ??= { projectId: item.project.id, projectName: item.project.name, total: 0 }
      byProject[item.project.id].total += 1
      if (buffer !== null) editedCount += 1
      manifestItems.push({
        ...item, destPath: target, action: 'written', edited: buffer !== null, editEngine: buffer !== null ? EDIT_ENGINE : null, editRecipe: recipe,
      })
    } catch (error) {
      failures.push({ projectId: item.project.id, relPath: item.rel_path, destPath: target, reason: String(error?.message ?? error) })
    }
  }

  for (const sample of before) {
    const changed = await verifySourcesUnchanged(sample.project, sample.records)
    if (changed.length > 0) {
      throw httpError(`source files changed during export: ${changed.slice(0, 5).join(', ')}`, 'SOURCE_MODIFIED', 500)
    }
  }

  const createdAt = Date.now()
  const csvHeader = 'project_id,project_name,rel_path,bucket,verdict,ai_score,reason,scenes,primary_scene,edited,edit_engine,dest_path\n'
  const csvRows = manifestItems.map(item => {
    const scenes = scenesOf(item)
    return [
      item.project.id, item.project.name, item.rel_path, item.verdict,
      item.human_verdict ?? item.ai_verdict ?? item.verdict,
      item.score ?? '', item.reason ?? '', scenes.join('|'), primarySceneOf(item, scenes) ?? '',
      item.edited ? 'true' : 'false', item.editEngine ?? '', item.destPath,
    ].map(csvField).join(',')
  })
  const manifestPath = path.join(options.dest, 'manifest.csv')
  await writeFile(manifestPath, csvHeader + csvRows.join('\n') + (csvRows.length > 0 ? '\n' : ''), 'utf8')
  await writeFile(path.join(options.dest, 'manifest.json'), JSON.stringify({
    scope: {
      projectIds: input.projectIds ?? null,
      scenes: input.scenes ?? null,
      verdicts: input.verdicts ?? null,
      selected: Array.isArray(input.items) && input.items.length > 0,
    },
    projects: projects.map(project => ({ id: project.id, name: project.name })),
    dest: options.dest,
    layout: options.layout,
    mode: options.mode,
    buckets: options.buckets,
    edit: options.edit,
    counts,
    byProject,
    editedCount,
    createdAt,
    warnings,
    items: manifestItems.map(item => {
      const scenes = scenesOf(item)
      return {
        projectId: item.project.id,
        projectName: item.project.name,
        relPath: item.rel_path,
        bucket: item.verdict,
        verdict: item.human_verdict ?? item.ai_verdict ?? item.verdict,
        score: item.score ?? null,
        reason: item.reason ?? null,
        scenes,
        primaryScene: primarySceneOf(item, scenes),
        editSource: recipeOf(item) === null ? null : (item.edit_source ?? null),
        destPath: item.destPath,
        action: item.action,
        edited: item.edited === true,
        editEngine: item.editEngine ?? null,
        editRecipe: item.editRecipe ?? null,
      }
    }),
  }, null, 2), 'utf8')

  return {
    dest: options.dest,
    layout: options.layout,
    mode: options.mode,
    edit: options.edit,
    counts,
    byProject,
    total: manifestItems.length,
    editedCount,
    skipped: skipped.length,
    failures: failures.slice(0, 20),
    failureCount: failures.length,
    manifestPath,
    warnings,
    items: manifestItems,
  }
}
