import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react'

// esbuild 用 jsxFactory: 'h' 编译 JSX；Fragment 用于多根节点。
const h = React.createElement
const Fragment = React.Fragment

const NS = 'photoPicker'
const PANEL_ID = 'photo-picker'

import { getLanguage, postProcessingLabel, setLanguage, subscribeLanguage, translate, zh, en } from './locales.js'
import { installStyles } from './theme.js'
import { computeColumns, computeRowHeight, computeVisibleRows, TILE_GAP, TILE_MIN, TILE_MIN_NARROW } from './virtual.js'
import { CROP_RATIOS, fitAspect, moveCrop, normalizeCrop, orientedAspect, resizeCrop } from './crop.js'
import { ActionBar, BackButton, Button, Card, CloseButton, DrawerShell, Field, Input, ModalShell, Segmented, StateCard, Tabs } from './ui'


// Plan 3 SMB 首版等待 macOS 网络卷权限方案，先隐藏入口；Host/API 代码保留。
const SMB_ENABLED = false

async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    headers: { 'content-type': 'application/json' },
    ...init,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => undefined)
    throw new Error(body?.error?.message ?? response.statusText)
  }
  return response.json()
}

function statusLabel(t: (key: string) => string, status: string) {
  if (status === 'created') return t('statusCreated')
  if (status === 'scanned') return t('statusScanned')
  if (status === 'preprocessed') return t('statusPreprocessed')
  if (status === 'gridded') return t('statusGridded')
  if (status === 'scored') return t('statusScored')
  if (status === 'paused') return t('statusPaused')
  if (status === 'failed') return t('statusFailed')
  return status
}

function stageLabel(t: (key: string) => string, stage: string) {
  const keys: Record<string, string> = {
    scan: 'stageScan', preprocess: 'stagePreprocess', grid: 'stageGrid', rank: 'stageRank', score: 'stageScore',
  }
  return keys[stage] === undefined ? stage : t(keys[stage])
}

const VERDICT_KEYS: Record<string, string> = { keep: 'verdictKeep', maybe: 'verdictMaybe', reject: 'verdictReject' }
const STATE_KEYS: Record<string, string> = {
  ok: 'stateOk', candidate: 'stateCandidate', unreadable: 'stateUnreadable',
  filtered_dup: 'stateFilteredDup', filtered_blur: 'stateFilteredBlur',
  filtered_exposure: 'stateFilteredExposure', filtered_small: 'stateFilteredSmall',
  grid_selected: 'stateGridSelected', grid_rejected: 'stateGridRejected', grid_error: 'stateGridError',
  scored: 'stateScored', score_failed: 'stateScoreFailed',
}
const RUN_STATUS_KEYS: Record<string, string> = {
  pending: 'runPending', running: 'runRunning', paused: 'runPaused',
  done: 'runDone', failed: 'runFailed', cancelled: 'runCancelled',
}
const STAT_KEYS: Array<[string, string]> = [
  ['photos', 'statPhotos'], ['skipped', 'statSkipped'], ['errors', 'statErrors'],
  ['selected', 'statSelected'], ['rejected', 'statRejected'], ['failed', 'statFailed'],
  ['groups', 'statGroups'], ['kept', 'statKept'], ['scored', 'statScored'], ['done', 'statDone'],
]
const PHASE_KEYS: Record<string, string> = { start: 'phaseStart', done: 'phaseDone' }

function verdictLabel(t: (key: string) => string, verdict: string | null | undefined) {
  if (verdict === null || verdict === undefined) return '—'
  return VERDICT_KEYS[verdict] === undefined ? verdict : t(VERDICT_KEYS[verdict])
}

const SCENE_KEYS: Record<string, string> = {
  portrait: 'scenePortrait',
  landscape: 'sceneLandscape',
  architecture: 'sceneArchitecture',
  street: 'sceneStreet',
  event: 'sceneEvent',
  flower: 'sceneFlower',
  wildlife: 'sceneWildlife',
  sculpture: 'sceneSculpture',
  other: 'sceneOther',
}

function sceneLabel(t: (key: string) => string, scene: string) {
  return SCENE_KEYS[scene] === undefined ? scene : t(SCENE_KEYS[scene])
}

function stateLabel(t: (key: string) => string, state: string) {
  return STATE_KEYS[state] === undefined ? state : t(STATE_KEYS[state])
}

function runStatusLabel(t: (key: string) => string, status: string) {
  return RUN_STATUS_KEYS[status] === undefined ? status : t(RUN_STATUS_KEYS[status])
}

function phaseLabel(t: (key: string) => string, phase: string) {
  return PHASE_KEYS[phase] === undefined ? phase : t(PHASE_KEYS[phase])
}

function summarizeStats(t: (key: string) => string, stats: any) {
  if (stats === null || stats === undefined) return ''
  const parts: string[] = []
  for (const [key, labelKey] of STAT_KEYS) {
    if (typeof stats[key] === 'number') parts.push(`${t(labelKey)} ${stats[key]}`)
  }
  if (typeof stats.durationMs === 'number') parts.push(`${Math.round(stats.durationMs / 1000)}${t('secondsShort')}`)
  return parts.join(' · ')
}

function estimateExportMs(preview: any): number | null {
  const total = Number(preview?.total ?? 0)
  if (!Number.isFinite(total) || total <= 0) return null
  const bytes = Math.max(0, Number(preview?.totalBytes ?? 0))
  const edited = Math.max(0, Number(preview?.editedCount ?? 0))
  const estimated = 900 + total * 35 + (bytes / (12 * 1024 * 1024)) * 1000 + edited * 250
  return Math.min(90_000, Math.max(1200, estimated))
}

/** 虚拟导出进度：有预览时按预估时间，否则在 1/3 后减速。 */
function useVirtualExportProgress(active: boolean, preview: any): number {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    if (!active) {
      setProgress(0)
      return
    }
    const startedAt = Date.now()
    const estimated = estimateExportMs(preview)
    const update = () => {
      const elapsed = Date.now() - startedAt
      if (estimated !== null) {
        setProgress(Math.min(0.96, (elapsed / estimated) * 0.96))
        return
      }
      // 无法估算时，先快速到 1/3，再把剩余 2/3 拉长。
      const slowStart = 1800
      const next = elapsed <= slowStart
        ? (elapsed / slowStart) * (1 / 3)
        : 1 / 3 + (0.96 - 1 / 3) * (1 - Math.exp(-(elapsed - slowStart) / 12000))
      setProgress(Math.min(0.96, next))
    }
    update()
    const timer = setInterval(update, 100)
    return () => clearInterval(timer)
  }, [active, preview])
  return progress
}

function ExportProgress({ t, progress }: { t: (key: string) => string; progress: number }) {
  const percent = Math.max(0, Math.min(99, Math.round(progress * 100)))
  return (
    <div className="pp-export-progress">
      <div className="pp-export-progress-head">
        <span>{t('exportInProgress')}</span>
        <span>{percent}%</span>
      </div>
      <div className="pp-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div className="pp-progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function CreateForm({ t, onCreated, onCancel }: {
  t: (key: string) => string
  onCreated: (id: string) => void
  onCancel: () => void
}) {
  const [sourceKind, setSourceKind] = useState<'local' | 'smb'>('local')
  const [smbUrl, setSmbUrl] = useState('')
  const [mountPoint, setMountPoint] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [folder, setFolder] = useState('')
  const [dirs, setDirs] = useState<{ name: string; path: string }[]>([])
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('30')
  const [busy, setBusy] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const browse = async (path: string) => {
    try {
      setDirs(await api(`/photo-picker/api/fs/list?path=${encodeURIComponent(path)}`))
      setFolder(path)
      setError(null)
    } catch (cause) {
      setError(String(cause))
    }
  }

  const choose = async () => {
    if (choosing) return
    setChoosing(true)
    try {
      const result = await api('/photo-picker/api/fs/choose', { method: 'POST' })
      setFolder(result.path)
      setError(null)
    } catch (cause) {
      setError(String(cause))
    } finally {
      setChoosing(false)
    }
  }

  const connectSmb = async () => {
    if (connecting) return
    setConnecting(true)
    setError(null)
    try {
      const connected = await api('/photo-picker/api/fs/smb/connect', {
        method: 'POST',
        body: JSON.stringify({ url: smbUrl }),
      })
      setMountPoint(connected.mountPoint)
      setFolder(connected.sourcePath ?? connected.mountPoint)
    } catch (cause) {
      setError(String(cause))
    } finally {
      setConnecting(false)
    }
  }

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      const source = sourceKind === 'smb'
        ? { kind: 'smb', path: folder || mountPoint, mountPoint, url: smbUrl }
        : { kind: 'local', path: folder }
      const project = await api('/photo-picker/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          source,
          name: name === '' ? undefined : name,
          budgetCny: Number(budget) || 30,
        }),
      })
      onCreated(project.id)
    } catch (cause) {
      setError(String(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pp-card pp-panel" style={{ maxWidth: 700 }}>
      <div className="pp-form">
        <div className="pp-page-nav">
          <BackButton label={t('back')} onClick={onCancel} />
        </div>
        <Field as="div" label={t('sourceType')}>
          <Tabs
            label={t('sourceType')}
            value={sourceKind}
            items={[
              { value: 'local', label: t('sourceLocal') },
              {
                value: 'smb',
                label: `${t('sourceSmb')}${SMB_ENABLED ? '' : ` · ${t('smbUnavailable')}`}`,
                disabled: !SMB_ENABLED,
                title: SMB_ENABLED ? undefined : t('smbUnavailable'),
              },
            ]}
            onChange={value => {
              if (value === 'local') setMountPoint('')
              setSourceKind(value as 'local' | 'smb')
              setError(null)
            }}
          />
        </Field>
        {sourceKind === 'local' ? (
          <>
            <Field as="div" label={t('folder')}>
              <div className="pp-row" style={{ alignItems: 'stretch' }}>
                <Input
                  value={folder}
                  onChange={event => setFolder(event.target.value)}
                  placeholder="/Users/…/Pictures"
                  aria-label={t('folder')}
                  style={{ flex: 1 }}
                />
                <Button disabled={choosing} onClick={choose}>
                  {choosing ? t('choosingFolder') : t('choose')}
                </Button>
                <Button onClick={() => browse(folder)}>{t('browse')}</Button>
              </div>
            </Field>
            {dirs.length > 0 && (
              <div className="pp-card pp-dir-list">
                {dirs.map(dir => (
                  <button type="button" className="pp-dir-row" key={dir.path} onClick={() => browse(dir.path)}>
                    {dir.name}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <Field as="div" label={t('smbUrl')} help={t('smbHint')}>
            <div className="pp-row" style={{ alignItems: 'stretch' }}>
              <Input
                value={smbUrl}
                onChange={event => { setSmbUrl(event.target.value); setMountPoint(''); setError(null) }}
                placeholder="smb://192.168.12.199/yueao"
                aria-label={t('smbUrl')}
                style={{ flex: 1 }}
              />
              <Button disabled={connecting || smbUrl === ''} onClick={connectSmb}>
                {connecting ? t('smbConnecting') : t('smbConnect')}
              </Button>
            </div>
            {mountPoint !== '' && <span className="pp-field-help">{t('smbConnected')}: {mountPoint}</span>}
          </Field>
        )}
        <Field label={t('name')}>
          <Input value={name} onChange={event => setName(event.target.value)} placeholder={t('namePlaceholder')} />
        </Field>
        <Field label={t('budget')} className="pp-field-narrow">
          <Input value={budget} onChange={event => setBudget(event.target.value)} />
        </Field>
        <ActionBar end>
          <Button variant="primary" disabled={busy || (sourceKind === 'local' ? folder === '' : mountPoint === '')} onClick={create}>
            {busy ? t('creating') : t('create')}
          </Button>
        </ActionBar>
        {error !== null && <StateCard kind="error" title={t('errorTitle')} message={error} />}
      </div>
    </div>
  )
}

const VERDICT_COLORS: Record<string, string> = {
  keep: 'var(--pp-status-keep)',
  maybe: 'var(--pp-status-maybe)',
  reject: 'var(--pp-status-reject)',
}

const DIMENSION_LABELS: Record<string, string> = {
  composition: 'dimensionComposition',
  light: 'dimensionLight',
  color: 'dimensionColor',
  technique: 'dimensionTechnique',
  post_potential: 'dimensionPostPotential',
  moment: 'dimensionMoment',
}

function ReviewSection({ t, projectId, version, onChanged, onFocusChange }: {
  t: (key: string) => string
  projectId: string
  version: number
  onChanged?: () => void
  onFocusChange?: (focused: boolean) => void
}) {
  const PAGE_SIZE = 200
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [nextOffset, setNextOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState('all')
  const [scene, setScene] = useState('all')
  const [sort, setSort] = useState('score')
  const [selected, setSelected] = useState<string[]>([])
  const [undo, setUndo] = useState<any[]>([])
  const [single, setSingle] = useState<string | null>(null)
  const [groupView, setGroupView] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const itemsRef = useRef<any[]>([])
  const requestRef = useRef(0)
  const wallRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [wallWidth, setWallWidth] = useState(0)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })
  const filterKey = `${filter}|${scene}|${sort}`
  const lastFilterKey = useRef('')

  useEffect(() => { onFocusChange?.(single !== null || groupView !== null) }, [single, groupView, onFocusChange])

  const fetchPage = async (offset: number) => {
    const params = new URLSearchParams({ scope: 'review', sort, limit: String(PAGE_SIZE), offset: String(offset) })
    if (filter !== 'all') params.set('verdict', filter)
    if (scene !== 'all') params.set('scene', scene)
    return api(`/photo-picker/api/projects/${projectId}/photos?${params.toString()}`)
  }

  const applyItems = (next: any[], count: number) => {
    itemsRef.current = next
    setItems(next)
    setTotal(count)
    setNextOffset(next.length)
    setHasMore(next.length < count)
  }

  const loadPage = async (offset: number, append: boolean) => {
    const generation = ++requestRef.current
    if (append) setLoadingMore(true)
    else {
      setLoading(true)
      setSelected([])
    }
    try {
      const data = await fetchPage(offset)
      if (generation !== requestRef.current) return
      const seen = new Set<string>()
      const merged: any[] = []
      for (const item of [...(append ? itemsRef.current : []), ...(data.items ?? [])]) {
        if (!seen.has(item.id)) {
          seen.add(item.id)
          merged.push(item)
        }
      }
      applyItems(merged, Number(data.total ?? merged.length))
      setError(null)
    } catch (cause) {
      if (generation === requestRef.current) setError(String(cause))
    } finally {
      if (generation === requestRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }

  const refreshLoaded = async () => {
    const count = itemsRef.current.length
    if (count === 0) {
      await loadPage(0, false)
      return
    }
    const generation = ++requestRef.current
    setLoadingMore(true)
    try {
      const pages = Math.ceil(count / PAGE_SIZE)
      const results: any[] = []
      for (let page = 0; page < pages; page += 1) {
        const data = await fetchPage(page * PAGE_SIZE)
        if (generation !== requestRef.current) return
        results.push(data)
      }
      const seen = new Set<string>()
      const merged: any[] = []
      for (const data of results) {
        for (const item of data.items ?? []) {
          if (!seen.has(item.id)) {
            seen.add(item.id)
            merged.push(item)
          }
        }
      }
      applyItems(merged, Number(results[0]?.total ?? merged.length))
      setError(null)
    } catch (cause) {
      if (generation === requestRef.current) setError(String(cause))
    } finally {
      if (generation === requestRef.current) setLoadingMore(false)
    }
  }

  const loadMore = async () => {
    if (!hasMore || loading || loadingMore) return itemsRef.current
    await loadPage(nextOffset, true)
    return itemsRef.current
  }

  useEffect(() => {
    const isFirst = lastFilterKey.current === ''
    const reset = isFirst || lastFilterKey.current !== filterKey
    lastFilterKey.current = filterKey
    if (reset) {
      void loadPage(0, false)
      wallRef.current?.scrollIntoView({ block: 'start' })
    } else {
      void refreshLoaded()
    }
  }, [filter, scene, sort, version])

  useEffect(() => {
    if (!hasMore || loading || loadingMore || items.length === 0 || sentinelRef.current === null) return
    const scrollRoot = wallRef.current?.closest(".pp-page")
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void loadMore()
    }, { root: scrollRoot ?? null, rootMargin: '400px' })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, items.length, nextOffset, filter, scene, sort, wallWidth])

  useEffect(() => {
    const el = wallRef.current
    if (el === null) return
    const update = () => setWallWidth(el.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [items.length, single, groupView])

  const narrow = typeof window !== 'undefined' && window.matchMedia('(max-width: 880px)').matches
  const columns = computeColumns(wallWidth, narrow ? TILE_MIN_NARROW : TILE_MIN, TILE_GAP)
  const rowHeight = computeRowHeight(wallWidth, columns, TILE_GAP)
  const totalRows = Math.ceil(items.length / columns)

  useEffect(() => {
    const wall = wallRef.current
    if (wall === null) return
    const root = wall.closest(".pp-page")
    if (root === null) return
    let frame = 0
    const update = () => {
      const wallTop = wall.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop
      const next = computeVisibleRows({
        scrollTop: root.scrollTop,
        wallTop,
        rowHeight,
        totalRows,
        viewportHeight: root.clientHeight,
        overscan: 2,
      })
      setVisibleRange(current => (
        current.start === next.start && current.end === next.end ? current : next
      ))
    }
    const onScroll = () => {
      if (frame !== 0) return
      frame = requestAnimationFrame(() => { frame = 0; update() })
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame)
      root.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [wallWidth, rowHeight, totalRows, items.length, single, groupView])

  const markDecided = (photoIds: string[], verdict: string) => {
    const ids = new Set(photoIds)
    setItems(current => current.map(item => {
      if (!ids.has(item.id)) return item
      if (verdict === 'auto') return { ...item, humanVerdict: null, verdict: item.aiVerdict ?? 'maybe' }
      return { ...item, humanVerdict: verdict, verdict }
    }))
  }

  const decide = async (photoIds: string[], verdict: string) => {
    if (photoIds.length === 0) return
    const previous: Record<string, string | null> = {}
    for (const item of itemsRef.current) if (photoIds.includes(item.id)) previous[item.id] = item.humanVerdict
    try {
      await api(`/photo-picker/api/projects/${projectId}/decisions`, {
        method: 'POST',
        body: JSON.stringify({ photoIds, verdict }),
      })
      setUndo(stack => [{ previous }, ...stack].slice(0, 20))
      setSelected([])
      markDecided(photoIds, verdict)
      onChanged?.()
    } catch (cause) {
      setError(String(cause))
    }
  }

  const undoLast = async () => {
    const entry = undo[0]
    if (entry === undefined) return
    const groups: Record<string, string[]> = {}
    const previous: Record<string, string | null> = entry.previous
    for (const [photoId, verdict] of Object.entries(previous)) {
      const key = verdict ?? 'auto'
      groups[key] = [...(groups[key] ?? []), photoId]
    }
    try {
      for (const [verdict, photoIds] of Object.entries(groups)) {
        await api(`/photo-picker/api/projects/${projectId}/decisions`, {
          method: 'POST',
          body: JSON.stringify({ photoIds, verdict }),
        })
        markDecided(photoIds, verdict)
      }
      setUndo(stack => stack.slice(1))
      onChanged?.()
    } catch (cause) {
      setError(String(cause))
    }
  }

  const toggle = (photoId: string) => setSelected(current => (
    current.includes(photoId) ? current.filter(id => id !== photoId) : [...current, photoId]
  ))

  if (groupView !== null) {
    return (
      <GroupCompare
        t={t}
        projectId={projectId}
        groupId={groupView}
        version={version}
        onNavigate={setGroupView}
        onClose={() => setGroupView(null)}
        onDecided={async () => { await refreshLoaded(); onChanged?.() }}
      />
    )
  }

  if (single !== null) {
    return (
      <PhotoSingle
        t={t}
        projectId={projectId}
        items={items}
        photoId={single}
        version={version}
        onNavigate={setSingle}
        onNeedMore={loadMore}
        onOpenGroup={setGroupView}
        onDecide={decide}
        onScenesUpdated={async () => { await refreshLoaded(); onChanged?.() }}
        onClose={() => setSingle(null)}
      />
    )
  }

  const filters: Array<[string, string]> = [
    ['all', t('filterAll')],
    ['keep', verdictLabel(t, 'keep')],
    ['maybe', verdictLabel(t, 'maybe')],
    ['reject', verdictLabel(t, 'reject')],
  ]

  return (
    <section className="pp-review">
      <div className="pp-toolbar">
        <div className="pp-toolbar-group">
          <span className="pp-section-title">{t('review')}</span>
          <Segmented
            label={t('review')}
            value={filter}
            items={filters.map(([value, label]) => ({ value, label }))}
            onChange={setFilter}
          />
        </div>
        <div className="pp-toolbar-group pp-toolbar-end">
          <label className="pp-toolbar-field">
            <span>{t('sceneFilter')}</span>
            <select value={scene} onChange={event => setScene(event.target.value)} className="pp-select pp-select-sm">
              <option value="all">{t('filterAll')}</option>
              {Object.keys(SCENE_KEYS).map(key => (
                <option key={key} value={key}>{t(SCENE_KEYS[key])}</option>
              ))}
            </select>
          </label>
          <label className="pp-toolbar-field">
            <span>{t('sortLabel')}</span>
            <select value={sort} onChange={event => setSort(event.target.value)} className="pp-select pp-select-sm">
              <option value="score">{t('sortScore')}</option>
              <option value="score_asc">{t('sortScoreAsc')}</option>
              <option value="group">{t('sortGroup')}</option>
              <option value="taken_at">{t('sortTaken')}</option>
              <option value="rel_path">{t('sortPath')}</option>
            </select>
          </label>
          <span className="pp-muted">{total} {t('photos')}</span>
          <Button disabled={undo.length === 0} onClick={undoLast}>{t('undoAction')}</Button>
        </div>
      </div>

      {error !== null && <div className="pp-error">{error} <Button size="sm" onClick={() => loadPage(0, false)}>{t('retry')}</Button></div>}

      {loading && items.length === 0 ? (
        <StateCard kind="loading" title={t('loading')} />
      ) : items.length === 0 ? (
        <StateCard
          kind="empty"
          title={t('reviewEmpty')}
          action={filter !== 'all' || scene !== 'all' ? (
            <Button onClick={() => { setFilter('all'); setScene('all') }}>{t('clearFilters')}</Button>
          ) : undefined}
        />
      ) : (
        <>
        <div className="pp-wall" ref={wallRef} style={{ height: totalRows * rowHeight }}>
          {Array.from({ length: Math.max(0, visibleRange.end - visibleRange.start) }, (_, offset) => {
            const row = visibleRange.start + offset
            const rowItems = items.slice(row * columns, (row + 1) * columns)
            if (rowItems.length === 0) return null
            return (
              <div
                className="pp-wall-row"
                key={`row-${row}`}
                style={{
                  top: row * rowHeight,
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {rowItems.map(item => {
                  const sceneText = Array.isArray(item.scenes)
                    ? item.scenes.map((value: string) => sceneLabel(t, value)).join(' · ')
                    : ''
                  return (
                    <div className="pp-tile-wrap" key={item.id}>
                      <button
                        type="button"
                        className={`pp-tile${selected.includes(item.id) ? ' selected' : ''}`}
                        title={sceneText === '' ? item.relPath : `${item.relPath} · ${sceneText}`}
                        aria-label={sceneText === '' ? item.relPath : `${item.relPath} · ${sceneText}`}
                        onClick={() => setSingle(item.id)}
                      >
                        <img src={`${item.thumbUrl}?v=${version}`} alt={item.relPath} loading="lazy" />
                        <span
                          className="pp-tile-bar"
                          style={{ background: VERDICT_COLORS[item.verdict] ?? 'var(--dsw-alias-border-l2)' }}
                        />
                        {item.score !== null && <span className="pp-tile-score">{Number(item.score).toFixed(1)}</span>}
                        {sceneText !== '' && <span className="pp-tile-scenes">{sceneText}</span>}
                        {item.humanVerdict !== null && (
                          <span className="pp-tile-human">{verdictLabel(t, item.humanVerdict)}</span>
                        )}
                      </button>
                      <input
                        className="pp-check"
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => toggle(item.id)}
                        aria-label={item.relPath}
                      />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
        {hasMore && wallWidth > 0 && (
          <div className="pp-load-more" ref={sentinelRef}>
            {loadingMore ? t('loading') : t('loadMore')}
          </div>
        )}
        </>
      )}

      {selected.length > 0 && (
        <div className="pp-batch">
          <span className="pp-muted">{t('selectedCount')} {selected.length}</span>
          <Button onClick={() => decide(selected, 'keep')}>{t('keep')}</Button>
          <Button onClick={() => decide(selected, 'maybe')}>{t('maybe')}</Button>
          <Button variant="danger" onClick={() => decide(selected, 'reject')}>{t('reject')}</Button>
          <Button variant="ghost" onClick={() => setSelected([])}>{t('clearSelection')}</Button>
        </div>
      )}
    </section>
  )
}

function storedGuide(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function storeGuide(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    // 隐私模式或存储被禁用时只保留当前会话状态
  }
}

function SceneEditor({ t, projectId, photoId, detail, onClose, onSaved }: any) {
  const [selected, setSelected] = useState<string[]>(Array.isArray(detail.scenes) ? detail.scenes : [])
  const [primary, setPrimary] = useState<string | null>(detail.primaryScene ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (scene: string) => {
    setSelected(current => {
      if (current.includes(scene)) {
        const next = current.filter(value => value !== scene)
        if (primary === scene) setPrimary(next[0] ?? null)
        return next
      }
      if (current.length >= 3) return current
      return [...current, scene]
    })
  }

  const save = async (clear = false) => {
    setBusy(true)
    setError(null)
    try {
      const nextScenes = clear ? [] : selected
      await api(`/photo-picker/api/projects/${projectId}/photos/${photoId}/scenes`, {
        method: 'PATCH',
        body: JSON.stringify({
          scenes: nextScenes,
          primaryScene: clear || nextScenes.length === 0
            ? null
            : (nextScenes.includes(primary ?? '') ? primary : nextScenes[0]),
        }),
      })
      await onSaved()
      onClose()
    } catch (cause) {
      setError(String(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModalShell title={t('editScenes')} closeLabel={t('close')} onClose={onClose}>
      <div className="pp-form">
        <div className="pp-muted">{t('sceneEditHint')}</div>
        <div className="pp-option-group pp-option-group-wrap pp-option-group-scene" role="group" aria-label={t('editScenes')}>
          {Object.entries(SCENE_KEYS).map(([scene, key]) => (
            <label key={scene} className="pp-option">
              <input
                type="checkbox"
                checked={selected.includes(scene)}
                disabled={busy || (!selected.includes(scene) && selected.length >= 3)}
                onChange={() => toggle(scene)}
              />
              {t(key)}
            </label>
          ))}
        </div>
        <Field label={t('primaryScene')}>
          {selected.length === 0 ? (
            <div className="pp-muted">{t('primarySceneEmpty')}</div>
          ) : (
            <div className="pp-option-group pp-option-group-primary" role="radiogroup" aria-label={t('primaryScene')}>
              {selected.map(scene => (
                <label className="pp-option" key={scene}>
                  <input
                    type="radio"
                    name="primary-scene"
                    value={scene}
                    disabled={busy}
                    checked={(primary ?? selected[0]) === scene}
                    onChange={() => setPrimary(scene)}
                  />
                  {sceneLabel(t, scene)}
                </label>
              ))}
            </div>
          )}
        </Field>
        <div className="pp-muted">{detail.sceneSource === 'human' ? t('sceneSourceHuman') : t('sceneSourceAi')}</div>
        {error !== null && <StateCard kind="error" title={t('errorTitle')} message={error} />}
        <ActionBar end>
          {detail.sceneSource === 'human' && (
            <Button variant="ghost" disabled={busy} onClick={() => save(true)}>{t('resetScenes')}</Button>
          )}
          <Button disabled={busy} onClick={onClose}>{t('cancel')}</Button>
          <Button variant="primary" disabled={busy} onClick={() => save(false)}>{t('saveScenes')}</Button>
        </ActionBar>
      </div>
    </ModalShell>
  )
}

const RECIPE_CONTROLS = [
  { key: 'exposureEv', label: 'editExposure', min: -2, max: 2, step: 0.05, digits: 2, signed: true, unit: 'EV' },
  { key: 'contrast', label: 'editContrast', min: -1, max: 1, step: 0.01, digits: 2, signed: true, unit: '' },
  { key: 'saturation', label: 'editSaturation', min: -1, max: 1, step: 0.01, digits: 2, signed: true, unit: '' },
  { key: 'sharpen', label: 'editSharpen', min: 0, max: 2, step: 0.01, digits: 2, signed: false, unit: '' },
  { key: 'rotate', label: 'editRotate', min: -5, max: 5, step: 0.1, digits: 1, signed: true, unit: '°' },
]

function defaultRecipe() {
  return {
    version: 1,
    crop: { left: 0, top: 0, width: 1, height: 1 },
    rotate: 0,
    exposureEv: 0,
    contrast: 0,
    saturation: 0,
    sharpen: 0,
  }
}

function isIdentityDraft(recipe: any): boolean {
  const crop = recipe?.crop ?? { left: 0, top: 0, width: 1, height: 1 }
  return Math.abs(crop.left) < 1e-6
    && Math.abs(crop.top) < 1e-6
    && Math.abs(crop.width - 1) < 1e-6
    && Math.abs(crop.height - 1) < 1e-6
    && Math.abs(recipe?.rotate ?? 0) < 1e-6
    && Math.abs(recipe?.exposureEv ?? 0) < 1e-6
    && Math.abs(recipe?.contrast ?? 0) < 1e-6
    && Math.abs(recipe?.saturation ?? 0) < 1e-6
    && Math.abs(recipe?.sharpen ?? 0) < 1e-6
}

const CROP_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const CROP_HANDLE_KEYS: Record<string, string> = {
  nw: 'cropHandleNw', n: 'cropHandleN', ne: 'cropHandleNe', e: 'cropHandleE',
  se: 'cropHandleSe', s: 'cropHandleS', sw: 'cropHandleSw', w: 'cropHandleW',
}

function cropRatioLabel(id: string, frameAspect: number, swapped: boolean): string {
  if (id === 'free') return ''
  const [long, short] = id.split(/:/)
  const horizontal = frameAspect >= 1 ? !swapped : swapped
  return horizontal ? `${long}:${short}` : `${short}:${long}`
}

function CropRatioIcon({ id }: { id: string }) {
  if (id === 'free') {
    return <span className="pp-crop-ratio-icon pp-crop-ratio-icon-free" aria-hidden="true" />
  }
  return <span className="pp-crop-ratio-icon" data-ratio={id} aria-hidden="true" />
}

function CropOverlay({ t, crop, frameAspect, aspect, onChange }: any) {
  const layerRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<any>(null)
  const [dragging, setDragging] = useState(false)
  const current = normalizeCrop(crop)

  const start = (handle: string, event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const layer = layerRef.current
    if (layer === null) return
    const rect = layer.getBoundingClientRect()
    layer.setPointerCapture?.(event.pointerId)
    setDragging(true)
    dragRef.current = {
      handle,
      startX: event.clientX,
      startY: event.clientY,
      crop: current,
      width: rect.width,
      height: rect.height,
    }
  }

  const move = (event: React.PointerEvent) => {
    const drag = dragRef.current
    if (drag === null) return
    const dx = (event.clientX - drag.startX) / Math.max(1, drag.width)
    const dy = (event.clientY - drag.startY) / Math.max(1, drag.height)
    onChange(resizeCrop(drag.crop, drag.handle, dx, dy, frameAspect, aspect))
  }

  const end = (event: React.PointerEvent) => {
    if (dragRef.current === null) return
    dragRef.current = null
    setDragging(false)
    layerRef.current?.releasePointerCapture?.(event.pointerId)
  }

  const nudge = (event: React.KeyboardEvent, handle: string) => {
    const dx = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
    const dy = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0
    if (dx === 0 && dy === 0) return
    event.preventDefault()
    event.stopPropagation()
    const step = event.shiftKey ? 0.01 : 0.005
    if (handle === 'move' && !event.shiftKey) {
      onChange(moveCrop(current, dx * step, dy * step))
    } else {
      onChange(resizeCrop(current, handle === 'move' ? 'se' : handle, dx * step, dy * step, frameAspect, aspect))
    }
  }

  return (
    <div
      className="pp-crop-layer"
      ref={layerRef}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="pp-crop-mask" style={{ left: 0, right: 0, top: 0, height: `${current.top * 100}%` }} />
      <div className="pp-crop-mask" style={{ left: 0, right: 0, top: `${(current.top + current.height) * 100}%`, bottom: 0 }} />
      <div className="pp-crop-mask" style={{ left: 0, width: `${current.left * 100}%`, top: `${current.top * 100}%`, height: `${current.height * 100}%` }} />
      <div className="pp-crop-mask" style={{ left: `${(current.left + current.width) * 100}%`, right: 0, top: `${current.top * 100}%`, height: `${current.height * 100}%` }} />
      <div
        className="pp-crop-selection"
        role="group"
        tabIndex={0}
        aria-label={t('cropArea')}
        style={{ left: `${current.left * 100}%`, top: `${current.top * 100}%`, width: `${current.width * 100}%`, height: `${current.height * 100}%` }}
        onPointerDown={event => start('move', event)}
        onKeyDown={event => nudge(event, 'move')}
      >
        {dragging && (
          <div className="pp-crop-thirds" aria-hidden="true">
            <span className="v" style={{ left: '33.333%' }} />
            <span className="v" style={{ left: '66.666%' }} />
            <span className="h" style={{ top: '33.333%' }} />
            <span className="h" style={{ top: '66.666%' }} />
          </div>
        )}
        {CROP_HANDLES.map(handle => (
          <span
            key={handle}
            className={`pp-crop-handle pp-crop-handle-${handle}`}
            role="button"
            tabIndex={0}
            aria-label={t(CROP_HANDLE_KEYS[handle])}
            onPointerDown={event => start(handle, event)}
            onKeyDown={event => nudge(event, handle)}
          />
        ))}
      </div>
    </div>
  )
}

function PhotoSingle({ t, projectId, items, photoId, version, onNavigate, onNeedMore, onOpenGroup, onDecide, onClose, onScenesUpdated }: any) {
  const [detail, setDetail] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showEdited, setShowEdited] = useState(false)
  const [editedFailed, setEditedFailed] = useState(false)
  const [showGrid, setShowGrid] = useState(() => storedGuide('photoPicker.gridGuide'))
  const [showCross, setShowCross] = useState(() => storedGuide('photoPicker.crossGuide'))
  const [deciding, setDeciding] = useState(false)
  const [sceneEditorOpen, setSceneEditorOpen] = useState(false)
  const [draftRecipe, setDraftRecipe] = useState<any>(() => defaultRecipe())
  const [draftPreviewUrl, setDraftPreviewUrl] = useState<string | null>(null)
  const [cropEditing, setCropEditing] = useState(false)
  const [cropFrameUrl, setCropFrameUrl] = useState<string | null>(null)
  const [cropFrame, setCropFrame] = useState<{ width: number; height: number } | null>(null)
  const [cropEntry, setCropEntry] = useState<any>(null)
  const [cropRatio, setCropRatio] = useState('free')
  const [cropSwapped, setCropSwapped] = useState(false)
  const [recipeBusy, setRecipeBusy] = useState(false)
  const [recipeError, setRecipeError] = useState<string | null>(null)
  const draftPreviewUrlRef = useRef<string | null>(null)
  const cropFrameUrlRef = useRef<string | null>(null)
  const cropPanelRef = useRef<HTMLDivElement | null>(null)
  const draftIsIdentity = isIdentityDraft(draftRecipe)
  const draftCrop = normalizeCrop(draftRecipe?.crop)
  const savedCrop = normalizeCrop(detail?.editRecipe?.crop)
  const cropDirty = JSON.stringify(draftCrop) !== JSON.stringify(savedCrop)
  const draftDirty = detail === null ? false : cropDirty || RECIPE_CONTROLS.some(control => (
    Number(draftRecipe?.[control.key] ?? 0) !== Number(detail?.editRecipe?.[control.key] ?? 0)
  ))
  const frameAspect = cropFrame !== null
    ? cropFrame.width / cropFrame.height
    : (detail?.width && detail?.height ? detail.width / detail.height : 1)
  const selectedRatio = CROP_RATIOS.find(item => item.id === cropRatio)
  const cropAspect = selectedRatio?.value ? orientedAspect(selectedRatio.value, frameAspect, cropSwapped) : null
  const cropBaseIdentity = isIdentityDraft({ ...draftRecipe, crop: { left: 0, top: 0, width: 1, height: 1 } })
  const cropBaseKey = RECIPE_CONTROLS.map(control => Number(draftRecipe?.[control.key] ?? 0)).join('|')

  const needMoreRef = useRef(onNeedMore)
  useEffect(() => { needMoreRef.current = onNeedMore }, [onNeedMore])

  const loadDetail = async () => {
    const next = await api(`/photo-picker/api/projects/${projectId}/photos/${photoId}`)
    setDetail(next)
    setError(null)
  }

  useEffect(() => {
    setDetail(null)
    setShowEdited(false)
    setEditedFailed(false)
    setCropEditing(false)
    setCropFrame(null)
    setCropEntry(null)
    loadDetail().catch(cause => setError(String(cause)))
  }, [photoId])

  useEffect(() => {
    setDraftRecipe(detail?.editRecipe ? { ...defaultRecipe(), ...detail.editRecipe } : defaultRecipe())
    setRecipeError(null)
  }, [detail?.editSignature, photoId])

  const decide = async (verdict: string) => {
    if (deciding) return
    setDeciding(true)
    try {
      await onDecide([photoId], verdict)
      await loadDetail()
    } catch (cause) {
      setError(String(cause))
    } finally {
      setDeciding(false)
    }
  }

  const setRecipeField = (key: string, value: number) => {
    setShowEdited(true)
    setDraftRecipe((current: any) => ({ ...current, [key]: value }))
  }

  const enterCrop = () => {
    setCropEntry({ ...normalizeCrop(draftRecipe.crop) })
    setCropRatio('free')
    setCropSwapped(false)
    setCropFrame(null)
    setCropEditing(true)
  }

  const finishCrop = () => {
    setCropEditing(false)
    setCropFrame(null)
  }

  const completeCrop = () => {
    if (!draftDirty) {
      finishCrop()
      return
    }
    void saveRecipe()
  }

  const cancelCrop = () => {
    if (cropEntry !== null) {
      setDraftRecipe((current: any) => ({ ...current, crop: { ...cropEntry } }))
    }
    setCropEditing(false)
    setCropFrame(null)
    setCropRatio('free')
    setCropSwapped(false)
  }

  const applyCropRatio = (id: string) => {
    setCropRatio(id)
    if (id === 'original') {
      setDraftRecipe((current: any) => ({ ...current, crop: { left: 0, top: 0, width: 1, height: 1 } }))
      return
    }
    const preset = CROP_RATIOS.find(item => item.id === id)
    if (!preset?.value) return
    const aspect = orientedAspect(preset.value, frameAspect, cropSwapped)
    setDraftRecipe((current: any) => ({ ...current, crop: fitAspect(current.crop, frameAspect, aspect) }))
  }

  const swapCropAspect = () => {
    const next = !cropSwapped
    setCropSwapped(next)
    const preset = CROP_RATIOS.find(item => item.id === cropRatio)
    if (!preset?.value) return
    const aspect = orientedAspect(preset.value, frameAspect, next)
    setDraftRecipe((current: any) => ({ ...current, crop: fitAspect(current.crop, frameAspect, aspect) }))
  }

  const onCropFrameLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget
    if (!image.naturalWidth || !image.naturalHeight) return
    const nextFrame = { width: image.naturalWidth, height: image.naturalHeight }
    setCropFrame(nextFrame)
    if (!cropEditing) return
    const nextAspect = selectedRatio?.value
      ? orientedAspect(selectedRatio.value, nextFrame.width / nextFrame.height, cropSwapped)
      : null
    setDraftRecipe((current: any) => {
      const crop = nextAspect === null
        ? normalizeCrop(current.crop)
        : fitAspect(current.crop, nextFrame.width / nextFrame.height, nextAspect)
      return JSON.stringify(normalizeCrop(current.crop)) === JSON.stringify(crop)
        ? current
        : { ...current, crop }
    })
  }

  const saveRecipe = async () => {
    if (recipeBusy) return
    setRecipeBusy(true)
    setRecipeError(null)
    try {
      await api(`/photo-picker/api/projects/${projectId}/photos/${photoId}/recipe`, {
        method: 'PATCH',
        body: JSON.stringify({ recipe: draftRecipe }),
      })
      await loadDetail()
      setShowEdited(true)
      setCropEditing(false)
      setCropFrame(null)
      await onScenesUpdated?.()
    } catch (cause) {
      setRecipeError(String(cause))
    } finally {
      setRecipeBusy(false)
    }
  }

  const resetRecipe = async () => {
    if (recipeBusy) return
    setRecipeBusy(true)
    setRecipeError(null)
    try {
      await api(`/photo-picker/api/projects/${projectId}/photos/${photoId}/recipe`, {
        method: 'PATCH',
        body: JSON.stringify({ recipe: null }),
      })
      await loadDetail()
      setShowEdited(true)
      setCropEditing(false)
      setCropFrame(null)
      await onScenesUpdated?.()
    } catch (cause) {
      setRecipeError(String(cause))
    } finally {
      setRecipeBusy(false)
    }
  }

  const index = items.findIndex((item: any) => item.id === photoId)
  const move = async (delta: number) => {
    let list = items
    let next = list[index + delta]
    if (next === undefined && delta > 0 && typeof needMoreRef.current === 'function') {
      list = await needMoreRef.current()
      next = list[index + delta]
    }
    if (next !== undefined) onNavigate(next.id)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (cropEditing) return
      const target = event.target as HTMLElement | null
      if (target !== null && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === 'j' || event.key === 'ArrowRight') void move(1)
      else if (event.key === 'k' || event.key === 'ArrowLeft') void move(-1)
      else if (event.key === 'p') void decide('keep')
      else if (event.key === 'm') void decide('maybe')
      else if (event.key === 'x') void decide('reject')
      else if (event.key === 'g' && detail?.group !== undefined) onOpenGroup(detail.group.id)
      else if (event.key === ' ' || event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [photoId, index, items, detail, deciding, cropEditing])

  useEffect(() => {
    if (cropEditing) cropPanelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [cropEditing])

  useEffect(() => {
    return () => {
      if (draftPreviewUrlRef.current !== null) {
        URL.revokeObjectURL(draftPreviewUrlRef.current)
        draftPreviewUrlRef.current = null
      }
      if (cropFrameUrlRef.current !== null) {
        URL.revokeObjectURL(cropFrameUrlRef.current)
        cropFrameUrlRef.current = null
      }
    }
  }, [photoId])

  useEffect(() => {
    if (cropEditing) return
    if (!detail || !draftDirty) {
      if (draftPreviewUrlRef.current !== null) {
        URL.revokeObjectURL(draftPreviewUrlRef.current)
        draftPreviewUrlRef.current = null
        setDraftPreviewUrl(null)
      }
      return
    }
    if (draftIsIdentity) {
      if (draftPreviewUrlRef.current !== null) {
        URL.revokeObjectURL(draftPreviewUrlRef.current)
        draftPreviewUrlRef.current = null
        setDraftPreviewUrl(null)
      }
      setShowEdited(false)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/photo-picker/api/projects/${projectId}/photos/${photoId}/edit-preview`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ recipe: draftRecipe }),
          signal: controller.signal,
        })
        if (!response.ok) {
          const body = await response.json().catch(() => undefined)
          throw new Error(body?.error?.message ?? response.statusText)
        }
        const blob = await response.blob()
        if (controller.signal.aborted) return
        const url = URL.createObjectURL(blob)
        if (draftPreviewUrlRef.current !== null) URL.revokeObjectURL(draftPreviewUrlRef.current)
        draftPreviewUrlRef.current = url
        setDraftPreviewUrl(url)
        setShowEdited(true)
        setRecipeError(null)
      } catch (cause) {
        if (!controller.signal.aborted && (cause as any)?.name !== 'AbortError') {
          setRecipeError(String(cause))
        }
      }
    }, 220)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [draftRecipe, draftDirty, draftIsIdentity, detail?.editSignature, photoId, cropEditing])

  useEffect(() => {
    if (!cropEditing || !detail || cropBaseIdentity) {
      if (cropFrameUrlRef.current !== null) {
        URL.revokeObjectURL(cropFrameUrlRef.current)
        cropFrameUrlRef.current = null
        setCropFrameUrl(null)
      }
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/photo-picker/api/projects/${projectId}/photos/${photoId}/edit-preview`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ recipe: { ...draftRecipe, crop: { left: 0, top: 0, width: 1, height: 1 } } }),
          signal: controller.signal,
        })
        if (!response.ok) {
          const body = await response.json().catch(() => undefined)
          throw new Error(body?.error?.message ?? response.statusText)
        }
        const blob = await response.blob()
        if (controller.signal.aborted) return
        const url = URL.createObjectURL(blob)
        if (cropFrameUrlRef.current !== null) URL.revokeObjectURL(cropFrameUrlRef.current)
        cropFrameUrlRef.current = url
        setCropFrameUrl(url)
      } catch (cause) {
        if (!controller.signal.aborted && (cause as any)?.name !== 'AbortError') {
          setRecipeError(String(cause))
        }
      }
    }, 220)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [cropEditing, cropBaseIdentity, cropBaseKey, detail?.editSignature, photoId])

  if (error !== null) return <StateCard kind="error" title={t('errorTitle')} message={error} />
  if (detail === null) return <StateCard kind="loading" title={t('loading')} />

  const dimensions = detail.dimensions ?? {}
  const recipe = detail.editRecipe ?? null
  const editedUrl = `/photo-picker/media/edit/${projectId}/${photoId}?v=${version}&e=${detail.editSignature ?? 'none'}`
  const draftPreviewing = draftPreviewUrl !== null && draftDirty && !draftIsIdentity
  const canCompare = (recipe !== null || draftPreviewing) && !editedFailed
  const showingEdited = showEdited && canCompare
  const imageSrc = showingEdited && draftPreviewing
    ? draftPreviewUrl
    : showingEdited ? editedUrl : `${detail.previewUrl}?v=${version}`
  const cropSrc = cropFrameUrl ?? `${detail.previewUrl}?v=${version}`
  const stageSrc = cropEditing ? cropSrc : imageSrc
  const sceneText = Array.isArray(detail.scenes)
    ? detail.scenes.map((scene: string) => sceneLabel(t, scene)).join(' · ')
    : ''
  return (
    <section className="pp-single">
      <div className="pp-single-head">
        <BackButton label={t('backToWall')} onClick={onClose} />
        {detail.group !== undefined && (
          <Button onClick={() => onOpenGroup(detail.group.id)}>{t('groupCompare')}</Button>
        )}
        <span className="pp-chip">{index + 1} / {items.length}</span>
        <span className="pp-pill" data-tone={detail.verdict}>{verdictLabel(t, detail.verdict)}</span>
        {detail.score !== null && <span className="pp-chip">{t('scoreLabel')} {detail.score}</span>}
        <span className="pp-muted" style={{ marginLeft: 'auto' }}>{detail.relPath}</span>
      </div>

      <div className="pp-single-body">
        <div className="pp-single-visual">
        <div className={`pp-stage${cropEditing ? ' pp-stage-cropping' : ''}`}>
          <div className="pp-stage-frame">
            <img
              src={stageSrc}
              alt={detail.relPath}
              onLoad={cropEditing ? onCropFrameLoad : undefined}
              onError={() => { if (showingEdited && !cropEditing) setEditedFailed(true) }}
            />
            {!cropEditing && sceneText !== '' && <span className="pp-stage-scenes" title={sceneText}>{sceneText}</span>}
            {cropEditing && (
              <CropOverlay
                t={t}
                crop={draftRecipe.crop}
                frameAspect={frameAspect}
                aspect={cropAspect}
                onChange={(crop: any) => { setShowEdited(true); setDraftRecipe((current: any) => ({ ...current, crop })) }}
              />
            )}
            {!cropEditing && showGrid && (
              <div className="pp-guide pp-guide-grid" aria-hidden="true">
                <span className="v" style={{ left: '33.333%' }} />
                <span className="v" style={{ left: '66.666%' }} />
                <span className="h" style={{ top: '33.333%' }} />
                <span className="h" style={{ top: '66.666%' }} />
              </div>
            )}
            {!cropEditing && showCross && (
              <div className="pp-guide pp-guide-cross" aria-hidden="true">
                <span className="v" style={{ left: '50%' }} />
                <span className="h" style={{ top: '50%' }} />
              </div>
            )}
            {!cropEditing && <div className="pp-stage-tools">
              <button
                type="button"
                className="pp-tool-btn"
                aria-pressed={showGrid}
                onClick={() => {
                  const next = !showGrid
                  setShowGrid(next)
                  storeGuide('photoPicker.gridGuide', next)
                }}
              >
                {t('gridGuide')}
              </button>
              <button
                type="button"
                className="pp-tool-btn"
                aria-pressed={showCross}
                onClick={() => {
                  const next = !showCross
                  setShowCross(next)
                  storeGuide('photoPicker.crossGuide', next)
                }}
              >
                {t('crossGuide')}
              </button>
            </div>}
            {!cropEditing && canCompare && (
              <button
                type="button"
                className="pp-photo-badge"
                aria-pressed={showingEdited}
                title={t('editToggleHint')}
                onClick={() => setShowEdited(value => !value)}
              >
                {showingEdited ? t('editAfter') : t('editBefore')}
              </button>
            )}
          </div>
        </div>
        {cropEditing && (
          <div className="pp-crop-panel" ref={cropPanelRef}>
            <div className="pp-crop-panel-head">
              <strong>{t('cropTitle')}</strong>
              <span className="pp-muted">{t('cropHint')}</span>
            </div>
            <label className="pp-crop-angle">
              <span>{t('editRotate')}</span>
              <input
                className="pp-crop-angle-range"
                type="range"
                min={-5}
                max={5}
                step={0.1}
                value={Number(draftRecipe?.rotate ?? 0)}
                onChange={event => setRecipeField('rotate', Number(event.target.value))}
              />
              <span className="pp-crop-angle-value">{Number(draftRecipe?.rotate ?? 0).toFixed(1)}°</span>
            </label>
            <div className="pp-crop-ratios">
              {CROP_RATIOS.map(preset => (
                <button
                  type="button"
                  key={preset.id}
                  className={`pp-crop-ratio${cropRatio === preset.id ? ' active' : ''}`}
                  onClick={() => applyCropRatio(preset.id)}
                >
                  <CropRatioIcon id={preset.id} />
                  <span>{preset.id === 'free' ? t('cropFree') : preset.id === 'original' ? t('cropOriginal') : cropRatioLabel(preset.id, frameAspect, cropSwapped)}</span>
                </button>
              ))}
            </div>
            <div className="pp-crop-actions">
              <button type="button" className="pp-crop-action" onClick={cancelCrop}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
                <span>{t('cropCancel')}</span>
              </button>
              <button type="button" className="pp-crop-action" disabled={cropRatio === 'free' || cropRatio === 'original' || cropRatio === '1:1'} onClick={swapCropAspect}>
                <span className="pp-crop-action-glyph">⇄</span>
                <span>{t('cropSwap')}</span>
              </button>
              <button type="button" className="pp-crop-action pp-crop-action-primary" onClick={completeCrop}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="m3.2 8.4 3 3 6.6-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{t('cropFinish')}</span>
              </button>
            </div>
          </div>
        )}
        </div>
        <aside className="pp-card pp-panel">
          <div className="pp-row" style={{ gap: 6 }}>
            <Button style={{ flex: 1 }} disabled={deciding} onClick={() => decide('keep')}>{t('keep')}</Button>
            <Button style={{ flex: 1 }} disabled={deciding} onClick={() => decide('maybe')}>{t('maybe')}</Button>
            <Button variant="danger" style={{ flex: 1 }} disabled={deciding} onClick={() => decide('reject')}>{t('reject')}</Button>
          </div>
          <Button size="sm" onClick={() => setSceneEditorOpen(true)}>{t('editScenes')}</Button>
          <div className="pp-kbd">{t('keyboardHint')}</div>
          <div className="pp-meters">
            {Object.keys(DIMENSION_LABELS).map(key => {
              const value = dimensions[key]
              return (
                <div key={key} className="pp-meter">
                  <span className="pp-muted">{t(DIMENSION_LABELS[key])}</span>
                  <div className="pp-meter-track">
                    <div className="pp-meter-fill" style={{ width: `${Math.max(0, Math.min(10, value ?? 0)) * 10}%` }} />
                  </div>
                  <span>{value === null || value === undefined ? '—' : value}</span>
                </div>
              )
            })}
          </div>
          {detail.reason !== null && (
            <div>
              <div className="pp-section-title" style={{ marginBottom: 4 }}>{t('reason')}</div>
              <div className="pp-reason">{detail.reason}</div>
            </div>
          )}
          {(detail.postProcessing ?? []).length > 0 && (
            <div>
              <div className="pp-section-title" style={{ marginBottom: 6 }}>{t('postProcessing')}</div>
              <div className="pp-chips">
                {detail.postProcessing.map((code: string) => <span key={code} className="pp-chip">{postProcessingLabel(t, code)}</span>)}
              </div>
            </div>
          )}
          <div>
            <div className="pp-recipe-card-head">
              <div className="pp-section-title">{t('editRecipe')}</div>
              {recipe !== null && (
                <span className="pp-chip">{detail.editSource === 'human' ? t('editRecipeHuman') : t('editRecipeAi')}</span>
              )}
            </div>
            {recipe === null && <div className="pp-muted">{t('editNoRecipe')}</div>}
            <div className="pp-recipe-editor-grid">
              {RECIPE_CONTROLS.filter(control => !(cropEditing && control.key === 'rotate')).map(control => {
                const value = Number(draftRecipe?.[control.key] ?? 0)
                const display = `${control.signed && value > 0 ? '+' : ''}${value.toFixed(control.digits)}${control.unit}`
                return (
                  <label className="pp-recipe-control" key={control.key}>
                    <span className="pp-recipe-control-head">
                      <span>{t(control.label)}</span>
                      <span className="pp-recipe-value">{display}</span>
                    </span>
                    <input
                      className="pp-range"
                      type="range"
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      value={value}
                      onChange={event => setRecipeField(control.key, Number(event.target.value))}
                    />
                  </label>
                )
              })}
            </div>
            <div className="pp-crop-summary">
              <span className="pp-muted">
                {t('editRecipeCropReadonly')}：{draftCrop.width === 1 && draftCrop.height === 1
                  ? t('editCropNone')
                  : `${Math.round(draftCrop.width * 100)}% × ${Math.round(draftCrop.height * 100)}% · ${t('editCropLeft')} ${Math.round(draftCrop.left * 100)}% · ${t('editCropTop')} ${Math.round(draftCrop.top * 100)}%`}
              </span>
              {!cropEditing && <Button size="sm" onClick={enterCrop}>{t('cropEdit')}</Button>}
            </div>
            {recipeError !== null && <StateCard kind="error" title={t('errorTitle')} message={recipeError} />}
            <div className="pp-recipe-actions">
              {detail.editSource === 'human' && (
                <Button variant="ghost" disabled={recipeBusy} onClick={() => { void resetRecipe() }}>{t('editRecipeReset')}</Button>
              )}
              {!cropEditing && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={recipeBusy || !draftDirty}
                  onClick={() => { void saveRecipe() }}
                >
                  {t('editRecipeSave')}
                </Button>
              )}
            </div>
          </div>
          <div className="pp-muted">
            {detail.width} × {detail.height}
            {detail.group !== undefined ? ` · ${t('groupRank').replace('{rank}', String(detail.group.rank)).replace('{size}', String(detail.group.size))}` : ''}
          </div>
        </aside>
      </div>
      {sceneEditorOpen && (
        <SceneEditor
          t={t}
          projectId={projectId}
          photoId={photoId}
          detail={detail}
          onClose={() => setSceneEditorOpen(false)}
          onSaved={async () => { await loadDetail(); await onScenesUpdated?.() }}
        />
      )}
    </section>
  )
}

function ExportDialog({ t, projectId, onClose, onDone }: { t: (key: string) => string; projectId: string; onClose: () => void; onDone?: (result: any) => void }) {
  const [dest, setDest] = useState('')
  const [buckets, setBuckets] = useState(['keep', 'maybe'])
  const [mode, setMode] = useState('hardlink')
  const [applyEdits, setApplyEdits] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [running, setRunning] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const progress = useVirtualExportProgress(running, preview)

  const toggleBucket = (bucket: string) => setBuckets(current => (
    current.includes(bucket) ? current.filter(item => item !== bucket) : [...current, bucket]
  ))

  const toggleEdits = (checked: boolean) => {
    setApplyEdits(checked)
    // 修图开关改变输出内容，旧预览不再可信。
    setPreview(null)
  }

  const choose = async () => {
    if (choosing) return
    setChoosing(true)
    try {
      const picked = await api('/photo-picker/api/fs/choose', { method: 'POST' })
      setDest(picked.path)
    } catch (cause) {
      setError(String(cause))
    } finally {
      setChoosing(false)
    }
  }

  const execute = async (action: 'preview' | 'run') => {
    setBusy(true)
    if (action === 'run') setRunning(true)
    setError(null)
    try {
      const data = await api(`/photo-picker/api/projects/${projectId}/export/${action}`, {
        method: 'POST',
        body: JSON.stringify({ dest, buckets, mode: applyEdits ? 'copy' : mode, edit: applyEdits ? 'recipe' : 'none' }),
      })
      if (action === 'preview') setPreview(data)
      else {
        setResult(data)
        setPreview(null)
        onDone?.(data)
      }
    } catch (cause) {
      setError(String(cause))
    } finally {
      setBusy(false)
      setRunning(false)
    }
  }

  return (
    <ModalShell title={t('exportTitle')} closeLabel={t('close')} onClose={onClose}>
      <div className="pp-form">
          <label className="pp-field">
            <span>{t('exportDest')}</span>
            <div className="pp-row" style={{ alignItems: 'stretch' }}>
              <input
                value={dest}
                onChange={event => setDest(event.target.value)}
                placeholder={t('destPlaceholder')}
                className="pp-input" style={{ flex: 1 }}
              />
              <Button disabled={choosing} onClick={choose}>
                {choosing ? t('choosingFolder') : t('exportChoose')}
              </Button>
            </div>
          </label>
          <div className="pp-export-fields">
            <span className="pp-export-label">{t('exportBuckets')}</span>
            <div className="pp-option-group">
              {['keep', 'maybe', 'reject'].map(bucket => (
                <label key={bucket} className="pp-option">
                  <input type="checkbox" checked={buckets.includes(bucket)} onChange={() => toggleBucket(bucket)} />
                  {verdictLabel(t, bucket)}
                </label>
              ))}
            </div>
            <span className="pp-export-label">{t('exportMode')}</span>
            <div className="pp-option-group" role="radiogroup" aria-label={t('exportMode')}>
              <label className="pp-option">
                <input type="radio" name="project-export-mode" value="hardlink" disabled={applyEdits} checked={!applyEdits && mode === 'hardlink'} onChange={() => setMode('hardlink')} />
                {t('exportHardlink')}
              </label>
              <label className="pp-option">
                <input type="radio" name="project-export-mode" value="copy" disabled={applyEdits} checked={applyEdits || mode === 'copy'} onChange={() => setMode('copy')} />
                {t('exportCopy')}
              </label>
            </div>
            <span className="pp-export-label" aria-hidden="true" />
            <div className="pp-option-group pp-option-group-span">
              <label className="pp-option">
                <input type="checkbox" checked={applyEdits} onChange={event => toggleEdits(event.target.checked)} />
                {t('editExport')}
              </label>
            </div>
          </div>
          {applyEdits && <div className="pp-callout">{t('editExportHint')}</div>}
        </div>

        {running && <ExportProgress t={t} progress={progress} />}

        <div className="pp-actions">
          <Button disabled={busy || dest === ''} onClick={() => execute('preview')}>{t('exportPreview')}</Button>
          <span style={{ flex: 1 }} />
          <Button variant="primary" disabled={busy || dest === '' || preview === null} onClick={() => execute('run')}>{t('exportRun')}</Button>
        </div>

        {error !== null && <div className="pp-error">{error}</div>}

        {preview !== null && (
          <div className="pp-callout">
            <div>
              {Object.entries(preview.counts).map(([bucket, count]) => `${verdictLabel(t, bucket)} ${count}`).join(' · ')}
              {' · '}{(preview.totalBytes / 1024 / 1024).toFixed(1)} MB
            </div>
            <div style={{ marginTop: 4 }}>
              {t('exportSkipped')} {preview.skippedExisting} · {t('exportConflict')} {preview.conflictCount} · {preview.sameVolume ? t('exportSameVolume') : t('exportCrossVolume')}
            </div>
            {preview.editedCount > 0 && (
              <div style={{ marginTop: 4 }}>{t('editExport')}: {preview.editedCount}</div>
            )}
          </div>
        )}

        {result !== null && (
          <div className="pp-callout">
            <div>{t('exportResult')}: {Object.entries(result.counts).map(([bucket, count]) => `${verdictLabel(t, bucket)} ${count}`).join(' · ')}</div>
            <div style={{ marginTop: 4, wordBreak: 'break-all' }}>{t('manifest')}: {result.manifestPath}</div>
            <div className="pp-actions" style={{ marginTop: 8 }}>
              <Button
                onClick={() => api('/photo-picker/api/fs/reveal', {
                  method: 'POST',
                  body: JSON.stringify({ path: result.manifestPath ?? dest }),
                }).catch(cause => setError(String(cause)))}
              >
                {t('revealInFinder')}
              </Button>
            </div>
            {result.failureCount > 0 && <div className="pp-error" style={{ marginTop: 4 }}>{t('exportConflict')}: {result.failureCount}</div>}
          </div>
        )}
    </ModalShell>
  )
}

function GroupCompare({ t, projectId, groupId, version, onNavigate, onClose, onDecided }: any) {
  const [groups, setGroups] = useState<any[]>([])
  const [detail, setDetail] = useState<any>(null)
  const [selected, setSelected] = useState(0)
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api(`/photo-picker/api/projects/${projectId}/groups?limit=200`)
      .then(data => setGroups(data.items))
      .catch(() => {})
  }, [projectId])

  useEffect(() => {
    setDetail(null)
    setSelected(0)
    setPage(0)
    api(`/photo-picker/api/projects/${projectId}/groups/${groupId}`)
      .then(setDetail)
      .catch(cause => setError(String(cause)))
  }, [groupId])

  const index = groups.findIndex(group => group.id === groupId)
  const switchGroup = (delta: number) => {
    const next = groups[index + delta]
    if (next !== undefined) onNavigate(next.id)
  }

  const decide = async (verdict: string, ids: string[]) => {
    setBusy(true)
    try {
      await api(`/photo-picker/api/projects/${projectId}/decisions`, {
        method: 'POST',
        body: JSON.stringify({ photoIds: ids, verdict }),
      })
      await onDecided?.()
      onClose()
    } catch (cause) {
      setError(String(cause))
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    if (detail === null) return
    const chosen = detail.members[selected]
    setBusy(true)
    try {
      await api(`/photo-picker/api/projects/${projectId}/decisions`, {
        method: 'POST',
        body: JSON.stringify({ photoIds: detail.members.map((member: any) => member.id), verdict: 'reject' }),
      })
      if (chosen !== undefined) {
        await api(`/photo-picker/api/projects/${projectId}/decisions`, {
          method: 'POST',
          body: JSON.stringify({ photoIds: [chosen.id], verdict: 'keep' }),
        })
      }
      await onDecided?.()
      onClose()
    } catch (cause) {
      setError(String(cause))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target !== null && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === 'Escape' || event.key === ' ') onClose()
      else if (event.key === 'ArrowLeft') switchGroup(-1)
      else if (event.key === 'ArrowRight') switchGroup(1)
      else if (event.key === 'Enter') confirm()
      else if (event.key === 'x' || event.key === 'X') {
        if (detail !== null) decide('reject', detail.members.map((member: any) => member.id))
      } else if (/^[1-6]$/.test(event.key) && detail !== null) {
        const position = page * 6 + Number(event.key) - 1
        if (position < detail.members.length) setSelected(position)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detail, selected, index, groups, page])

  if (error !== null) return <StateCard kind="error" title={t('errorTitle')} message={error} />
  if (detail === null) return <StateCard kind="loading" title={t('loading')} />

  const kindLabel = detail.kind === 'burst' ? t('groupKindBurst') : t('groupKindScene')
  const pageCount = Math.max(1, Math.ceil(detail.members.length / 6))
  const pageStart = page * 6
  const visible = detail.members.slice(pageStart, pageStart + 6)
  return (
    <section className="pp-single">
      <div className="pp-single-head">
        <BackButton label={t('backToWall')} onClick={onClose} />
        <span className="pp-chip">{kindLabel}</span>
        <span className="pp-chip">{detail.size} {t('photos')}</span>
        {pageCount > 1 && <span className="pp-chip">{page + 1} / {pageCount}</span>}
        <span className="pp-muted">{index >= 0 ? `${index + 1} / ${groups.length}` : ''}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {pageCount > 1 && (
            <>
              <Button size="sm" aria-label={t('previousPage')} title={t('previousPage')} disabled={page === 0} onClick={() => { setPage(page - 1); setSelected(pageStart - 6) }}>‹</Button>
              <Button size="sm" aria-label={t('nextPage')} title={t('nextPage')} disabled={page >= pageCount - 1} onClick={() => { setPage(page + 1); setSelected(pageStart + 6) }}>›</Button>
            </>
          )}
          <Button size="sm" aria-label={t('previousGroup')} title={t('previousGroup')} disabled={index <= 0} onClick={() => switchGroup(-1)}>←</Button>
          <Button size="sm" aria-label={t('nextGroup')} title={t('nextGroup')} disabled={index < 0 || index >= groups.length - 1} onClick={() => switchGroup(1)}>→</Button>
        </div>
      </div>

      <div className="pp-compare-grid">
        {visible.map((member: any, localPosition: number) => {
          const position = pageStart + localPosition
          return (
            <button
              key={member.id}
              type="button"
              className={`pp-compare-card${position === selected ? ' selected' : ''}`}
              onClick={() => setSelected(position)}
            >
              <img src={`${member.thumbUrl}?v=${version}`} alt={member.relPath} loading="lazy" />
              <span className="pp-edit-badge">
                #{position + 1}{member.score !== null && member.score !== undefined ? ` · ${Number(member.score).toFixed(1)}` : ''}
              </span>
              {member.humanVerdict !== null && (
                <span className="pp-pill" style={{ position: 'absolute', right: 8, bottom: 8, background: 'rgba(0,0,0,.62)', color: '#fff' }}>
                  {verdictLabel(t, member.humanVerdict)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="pp-actions">
        <Button variant="danger" disabled={busy} onClick={() => decide('reject', detail.members.map((member: any) => member.id))}>
          {t('groupRejectAll')}
        </Button>
        <span style={{ flex: 1 }} />
        <Button variant="primary" disabled={busy} onClick={confirm}>{t('groupConfirm')}</Button>
      </div>
      <div className="pp-kbd">{t('groupHint')}</div>
    </section>
  )
}

function CalibrationSection({ t, projectId, onApplied }: { t: any; projectId: string; onApplied?: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'blind' | 'report'>('idle')
  const [items, setItems] = useState<any[]>([])
  const [index, setIndex] = useState(0)
  const [labels, setLabels] = useState<any[]>([])
  const [report, setReport] = useState<any>(null)
  const [latest, setLatest] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api(`/photo-picker/api/projects/${projectId}/calibration`).then(setLatest).catch(() => {})
  }, [projectId])

  const start = async () => {
    setBusy(true)
    setError(null)
    try {
      const sample = await api(`/photo-picker/api/projects/${projectId}/calibration/sample?size=80`)
      if (sample.items.length === 0) {
        setError(t('calibrationNoSample'))
        return
      }
      setItems(sample.items)
      setIndex(0)
      setLabels([])
      setReport(null)
      setApplied(false)
      setPhase('blind')
    } catch (cause) {
      setError(String(cause))
    } finally {
      setBusy(false)
    }
  }

  const submit = async (allLabels: { photoId: string; verdict: string }[]) => {
    setBusy(true)
    try {
      const computed = await api(`/photo-picker/api/projects/${projectId}/calibration`, {
        method: 'POST',
        body: JSON.stringify({ labels: allLabels }),
      })
      setReport(computed)
      setLatest(computed)
      setPhase('report')
    } catch (cause) {
      setError(String(cause))
    } finally {
      setBusy(false)
    }
  }

  const label = async (verdict: string) => {
    const item = items[index]
    if (item === undefined) return
    const nextLabels = [...labels, { photoId: item.id, verdict }]
    setLabels(nextLabels)
    if (index + 1 < items.length) {
      setIndex(index + 1)
      return
    }
    await submit(nextLabels)
  }

  const apply = async () => {
    const source = report ?? latest?.metrics
    if (source === null || source === undefined) return
    const keep = source.suggestedKeep
    const maybe = source.suggestedMaybe
    if (keep === undefined) return
    setBusy(true)
    try {
      await api(`/photo-picker/api/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ thresholdKeep: keep, thresholdMaybe: maybe }),
      })
      setApplied(true)
      onApplied?.()
    } catch (cause) {
      setError(String(cause))
    } finally {
      setBusy(false)
    }
  }

  const summary = (data: any) => (
    <div className="pp-calibration-summary">
      <div className="pp-stats">
        {[
          [t('calibrationPrecision'), (data.keep?.precision ?? 0).toFixed(2)],
          [t('calibrationRecall'), (data.keep?.recall ?? 0).toFixed(2)],
          [t('calibrationF1'), (data.keep?.f1 ?? 0).toFixed(2)],
          [t('calibrationAgreement'), `${((data.agreement ?? 0) * 100).toFixed(0)}%`],
        ].map(([label, value]) => (
          <div className="pp-stat" key={String(label)}>
            <span className="pp-stat-value">{value}</span>
            <span className="pp-stat-label">{label}</span>
          </div>
        ))}
      </div>
      <div className="pp-row" style={{ alignItems: 'center' }}>
        <span className="pp-chip">
          {t('calibrationSuggested')}: {verdictLabel(t, 'keep')} ≥ {data.suggestedKeep} · {verdictLabel(t, 'maybe')} ≥ {data.suggestedMaybe}
        </span>
        <Button disabled={busy} onClick={apply}>
          {applied ? t('calibrationApplied') : t('calibrationApply')}
        </Button>
      </div>
    </div>
  )

  return (
    <Card className="pp-panel">
      <div className="pp-row" style={{ alignItems: 'center' }}>
        <div className="pp-section-title">{t('calibration')}</div>
        <Button disabled={busy} onClick={start}>{t('calibrationStart')}</Button>
        {phase === 'idle' && latest?.metrics !== null && latest?.metrics !== undefined && (
          <span className="pp-muted" style={{ marginLeft: 'auto' }}>{t('calibrationLast')}: {latest.sampleSize} {t('photos')}</span>
        )}
      </div>

      {error !== null && <StateCard kind="error" title={t('errorTitle')} message={error} />}

      {phase === 'idle' && latest?.metrics !== null && latest?.metrics !== undefined && summary(latest.metrics)}

      {phase === 'blind' && items[index] !== undefined && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="pp-row" style={{ alignItems: 'center' }}>
            <span className="pp-chip">{t('calibrationProgress').replace('{n}', String(index + 1)).replace('{total}', String(items.length))}</span>
            <span className="pp-muted" style={{ marginLeft: 'auto' }}>{t('calibrationHint')}</span>
            <CloseButton label={t('close')} onClick={() => setPhase('idle')} />
          </div>
          <div className="pp-stage" style={{ minHeight: 0, padding: 10 }}>
            <img src={items[index].previewUrl} alt={items[index].relPath} />
          </div>
          <div className="pp-actions">
            <Button disabled={busy} onClick={() => label('keep')}>{t('keep')}</Button>
            <Button disabled={busy} onClick={() => label('maybe')}>{t('maybe')}</Button>
            <Button variant="danger" disabled={busy} onClick={() => label('reject')}>{t('reject')}</Button>
          </div>
        </div>
      )}

      {phase === 'report' && report !== null && summary(report)}
    </Card>
  )
}

function SettingsDrawer({ t, detail, onClose, onSaved, onRunStage }: any) {
  const [form, setForm] = useState<any>(() => ({
    modelRoute: detail.modelRoute ?? 'deepseek-official',
    modelId: detail.modelId ?? 'deepseek-flash',
    concurrency: String(detail.concurrency ?? 8),
    budgetCny: String(detail.budgetCny ?? 30),
    gridCols: String(detail.gridCols ?? 4),
    gridRows: String(detail.gridRows ?? 4),
    thresholdKeep: String(detail.thresholdKeep ?? 7.5),
    thresholdMaybe: String(detail.thresholdMaybe ?? 6),
    groupBurstSeconds: String(detail.groupBurstSeconds ?? 2),
    groupBurstHamming: String(detail.groupBurstHamming ?? 12),
    groupSceneSeconds: String(detail.groupSceneSeconds ?? 60),
    groupSceneHamming: String(detail.groupSceneHamming ?? 6),
    stagePause: detail.stagePause === true,
    offpeakOnly: detail.offpeakOnly === true,
  }))
  const [prompt, setPrompt] = useState<any>(null)
  const [routes, setRoutes] = useState<any[]>([])
  const [models, setModels] = useState<any[]>([])
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api(`/photo-picker/api/prompt?project=${detail.id}`).then(setPrompt).catch(() => {})
    api('/photo-picker/api/model-routes')
      .then(data => {
        const nextRoutes = Array.isArray(data) ? data : []
        setRoutes(nextRoutes)
        const current = nextRoutes.find(route => route.id === (detail.modelRoute ?? 'deepseek-official'))
        if (current !== undefined) setModels(current.models ?? [])
        else {
          api(`/photo-picker/api/models?route=${encodeURIComponent(detail.modelRoute ?? 'deepseek-official')}`)
            .then(result => setModels(result.models ?? []))
            .catch(() => {})
        }
      })
      .catch(() => {
        api(`/photo-picker/api/models?route=${encodeURIComponent(detail.modelRoute ?? 'deepseek-official')}`)
          .then(data => setModels(data.models ?? []))
          .catch(() => {})
      })
  }, [detail.id])

  const changeRoute = async (routeId: string) => {
    set('modelRoute', routeId)
    try {
      const data = await api(`/photo-picker/api/models?route=${encodeURIComponent(routeId)}`)
      const nextModels = (data.models ?? []).filter((model: any) => (
        !Array.isArray(model.inputModalities) || model.inputModalities.includes('image')
      ))
      setModels(nextModels)
      if (!nextModels.some((model: any) => model.id === form.modelId)) {
        set('modelId', nextModels[0]?.id ?? '')
      }
    } catch (cause) {
      setError(String(cause))
    }
  }

  const set = (key: string, value: any) => {
    setForm((current: any) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await api(`/photo-picker/api/projects/${detail.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          modelRoute: form.modelRoute,
          modelId: form.modelId,
          concurrency: Number(form.concurrency),
          budgetCny: Number(form.budgetCny),
          gridCols: Number(form.gridCols),
          gridRows: Number(form.gridRows),
          thresholdKeep: Number(form.thresholdKeep),
          thresholdMaybe: Number(form.thresholdMaybe),
          groupBurstSeconds: Number(form.groupBurstSeconds),
          groupBurstHamming: Number(form.groupBurstHamming),
          groupSceneSeconds: Number(form.groupSceneSeconds),
          groupSceneHamming: Number(form.groupSceneHamming),
          stagePause: form.stagePause,
          offpeakOnly: form.offpeakOnly,
        }),
      })
      setSaved(true)
      onSaved?.()
    } catch (cause) {
      setError(String(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <DrawerShell title={t('settingsTitle')} closeLabel={t('close')} onClose={onClose}>
        <div className="pp-form">
          <div className="pp-section-title">{t('settingsBasic')}</div>
          <label className="pp-field">
            <span>{t('modelRoute')}</span>
            <select value={form.modelRoute} onChange={event => { void changeRoute(event.target.value) }} className="pp-select">
              {(routes.length === 0 ? [{ id: form.modelRoute, name: form.modelRoute }] : routes).map((route: any) => (
                <option key={route.id} value={route.id}>{route.name ?? route.id} ({route.id})</option>
              ))}
            </select>
          </label>
          <label className="pp-field">
            <span>{t('model')}</span>
            <select value={form.modelId} onChange={event => set('modelId', event.target.value)} className="pp-select">
              {(models.length === 0 ? [{ id: form.modelId, name: form.modelId }] : models).map((model: any) => {
                const supportsImage = Array.isArray(model.inputModalities)
                  ? model.inputModalities.includes('image')
                  : true
                return (
                  <option key={model.id} value={model.id} disabled={!supportsImage}>
                    {model.name ?? model.id}{supportsImage ? '' : ` — ${t('settingsNoImageModel')}`}
                  </option>
                )
              })}
            </select>
          </label>
          <div className="pp-row">
            <label className="pp-field">
              <span>{t('concurrency')}</span>
              <input value={form.concurrency} onChange={event => set('concurrency', event.target.value)} className="pp-input" />
            </label>
            <label className="pp-field">
              <span>{t('budget')}</span>
              <input value={form.budgetCny} onChange={event => set('budgetCny', event.target.value)} className="pp-input" />
            </label>
          </div>

          <div className="pp-section-title">{t('gridSize')} / {t('thresholds')}</div>
          <div className="pp-row">
            <label className="pp-field">
              <span>{t('gridCols')}</span>
              <input value={form.gridCols} onChange={event => set('gridCols', event.target.value)} className="pp-input" />
            </label>
            <label className="pp-field">
              <span>{t('gridRows')}</span>
              <input value={form.gridRows} onChange={event => set('gridRows', event.target.value)} className="pp-input" />
            </label>
          </div>
          <div className="pp-row">
            <label className="pp-field">
              <span>{t('thresholdKeep')}</span>
              <input value={form.thresholdKeep} onChange={event => set('thresholdKeep', event.target.value)} className="pp-input" />
            </label>
            <label className="pp-field">
              <span>{t('thresholdMaybe')}</span>
              <input value={form.thresholdMaybe} onChange={event => set('thresholdMaybe', event.target.value)} className="pp-input" />
            </label>
          </div>

          <div className="pp-section-title">{t('grouping')}</div>
          <div className="pp-row">
            <label className="pp-field">
              <span>{t('burstSeconds')}</span>
              <input value={form.groupBurstSeconds} onChange={event => set('groupBurstSeconds', event.target.value)} className="pp-input" />
            </label>
            <label className="pp-field">
              <span>{t('burstHamming')}</span>
              <input value={form.groupBurstHamming} onChange={event => set('groupBurstHamming', event.target.value)} className="pp-input" />
            </label>
          </div>
          <div className="pp-row">
            <label className="pp-field">
              <span>{t('sceneSeconds')}</span>
              <input value={form.groupSceneSeconds} onChange={event => set('groupSceneSeconds', event.target.value)} className="pp-input" />
            </label>
            <label className="pp-field">
              <span>{t('sceneHamming')}</span>
              <input value={form.groupSceneHamming} onChange={event => set('groupSceneHamming', event.target.value)} className="pp-input" />
            </label>
          </div>

          <div className="pp-section-title">{t('runOptions')}</div>
          <div className="pp-checks">
            <label>
              <input type="checkbox" checked={form.stagePause} onChange={event => set('stagePause', event.target.checked)} />
              {t('stagePause')}
            </label>
            <label>
              <input type="checkbox" checked={form.offpeakOnly} onChange={event => set('offpeakOnly', event.target.checked)} />
              {t('offpeak')}
            </label>
          </div>

          {prompt !== null && (
            <details>
              <summary className="pp-muted" style={{ cursor: 'pointer' }}>{t('promptSection')} · {prompt.version} · {t('viewPrompt')}</summary>
              <pre>
                {prompt.prompts.gridUser}{"\n\n---\n\n"}{prompt.prompts.rankUser}{"\n\n---\n\n"}{prompt.prompts.scoreUser}
              </pre>
            </details>
          )}

          <div className="pp-section-title">{t('rerunStages')}</div>
          <div className="pp-actions">
            {['preprocess', 'grid', 'rank', 'score'].map(stage => (
              <Button key={stage} onClick={() => onRunStage?.(stage)}>
                {t('rerun')} {stageLabel(t, stage)}
              </Button>
            ))}
          </div>

          <div className="pp-callout">{t('sceneRescoreHint')}</div>
          <div className="pp-callout">{t('settingsHint')}</div>
          {error !== null && <StateCard kind="error" title={t('errorTitle')} message={error} />}
          <div className="pp-modal-foot">
            <Button variant="primary" disabled={busy} onClick={save}>{t('save')}</Button>
            {saved && <span className="pp-muted">{t('saved')}</span>}
          </div>
        </div>
    </DrawerShell>
  )
}

function ProjectDetail({ t, id, onBack }: { t: (key: string) => string; id: string; onBack: () => void }) {
  const [detail, setDetail] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)
  const [checkpoints, setCheckpoints] = useState<any[]>([])
  const [pipelineEvent, setPipelineEvent] = useState<any>(null)
  const [singleStepsOpen, setSingleStepsOpen] = useState(false)
  const [aiRuns, setAiRuns] = useState<any[]>([])
  const [aiRunsTotal, setAiRunsTotal] = useState(0)
  const [aiRunsLoading, setAiRunsLoading] = useState(false)
  const [runTab, setRunTab] = useState<'checkpoints' | 'ai'>('checkpoints')
  const [noticeDismissed, setNoticeDismissed] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportNotice, setExportNotice] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    try {
      const [project, points, statistics, runs] = await Promise.all([
        api(`/photo-picker/api/projects/${id}`),
        api(`/photo-picker/api/projects/${id}/checkpoints`),
        api(`/photo-picker/api/projects/${id}/stats`),
        api(`/photo-picker/api/projects/${id}/ai-runs?limit=20&offset=0`),
      ])
      setDetail(project)
      setCheckpoints(points)
      setStats(statistics)
      setAiRuns(runs.items ?? [])
      setAiRunsTotal(Number(runs.total ?? 0))
      setError(null)
    } catch (cause) {
      setError(String(cause))
    }
  }

  useEffect(() => {
    refresh()
    const events = new EventSource(`/photo-picker/api/projects/${id}/events`)
    events.onmessage = message => {
      const event = JSON.parse(message.data)
      if (event.pipeline === true) setPipelineEvent(event)
      else if (event.stage !== undefined) setProgress(event)
      if (event.done === true) refresh()
    }
    return () => events.close()
  }, [id])

  const run = async (stage: string, action = 'start') => {
    try {
      await api(`/photo-picker/api/projects/${id}/actions`, {
        method: 'POST',
        body: JSON.stringify({ stage, action }),
      })
    } catch (cause) {
      setError(String(cause))
    }
  }

  useEffect(() => {
    if (pipelineEvent !== null && pipelineEvent.stage === 'pipeline'
      && (pipelineEvent.result !== undefined || pipelineEvent.error !== undefined)) {
      setNoticeDismissed(false)
    }
  }, [pipelineEvent])

  const runAll = async () => {
    try {
      setPipelineEvent({ stage: 'pipeline', phase: 'start' })
      await api(`/photo-picker/api/projects/${id}/actions`, {
        method: 'POST',
        body: JSON.stringify({ action: 'run_all' }),
      })
    } catch (cause) {
      setError(String(cause))
    }
  }

  const loadMoreAiRuns = async () => {
    if (aiRunsLoading || aiRuns.length >= aiRunsTotal) return
    setAiRunsLoading(true)
    try {
      const runs = await api(`/photo-picker/api/projects/${id}/ai-runs?limit=20&offset=${aiRuns.length}`)
      setAiRuns(current => [...current, ...(runs.items ?? [])])
      setAiRunsTotal(Number(runs.total ?? aiRunsTotal))
    } catch (cause) {
      setError(String(cause))
    } finally {
      setAiRunsLoading(false)
    }
  }

  if (detail === null) {
    return <StateCard kind="loading" title={t('loading')} />
  }

  const counts = detail.counts ?? {}
  const verdicts = stats?.verdicts ?? {}
  const version = detail.updatedAt ?? 0
  const aiDisabled = detail.ai?.hasImageModel === false
  const percent = progress?.total ? Math.min(100, Math.round((progress.done ?? 0) / progress.total * 100)) : 0
  const stages = ['scan', 'preprocess', 'grid', 'rank', 'score'] as string[]
  const stageStatus: Record<string, string> = {}
  for (const checkpoint of checkpoints) stageStatus[checkpoint.stage] = checkpoint.status
  const activeStage = detail.running === 'pipeline' ? progress?.stage : detail.running
  const runningLabel = detail.running === null
    ? null
    : detail.running === 'pipeline' ? t('autoRun') : stageLabel(t, detail.running)
  const spent = Number(detail.cost?.spentCny ?? 0)
  const budget = Number(detail.cost?.budgetCny ?? 0)
  const statItems = [
    { key: 'scored', label: t('stateScored'), value: String(counts.scored ?? 0) },
    { key: 'keep', label: verdictLabel(t, 'keep'), value: String(verdicts.keep ?? 0) },
    { key: 'maybe', label: verdictLabel(t, 'maybe'), value: String(verdicts.maybe ?? 0) },
    { key: 'reject', label: verdictLabel(t, 'reject'), value: String(verdicts.reject ?? 0) },
    { key: 'spent', label: t('spent'), value: `¥${spent.toFixed(2)}`, hint: `/ ¥${budget}` },
  ]

  let pipelineNotice: { kind: 'done' | 'paused' | 'failed', text: string } | null = null
  if (pipelineEvent !== null && pipelineEvent.stage === 'pipeline') {
    if (pipelineEvent.error !== undefined) {
      pipelineNotice = {
        kind: 'failed',
        text: t('autoFailedToast').replace('{error}', String(pipelineEvent.error)),
      }
    } else if (pipelineEvent.result !== undefined) {
      const completed = (pipelineEvent.result.completed ?? []).map((stage: string) => stageLabel(t, stage)).join(' → ')
      if (pipelineEvent.result.reason === 'paused') {
        pipelineNotice = {
          kind: 'paused',
          text: t('autoPausedToast')
            .replace('{stages}', completed || '—')
            .replace('{next}', pipelineEvent.result.stoppedAt !== null && pipelineEvent.result.stoppedAt !== undefined ? stageLabel(t, pipelineEvent.result.stoppedAt) : '—'),
        }
      } else {
        pipelineNotice = { kind: 'done', text: t('autoDoneToast').replace('{stages}', completed) }
      }
    }
  }

  return (
    <div className={`pp-detail${focusMode ? ' pp-detail-focused' : ''}`}>
      {focusMode ? (
        <div className="pp-focus-bar">
          <BackButton label={t('back')} onClick={onBack} />
          <strong className="pp-focus-name">{detail.name}</strong>
          <span className="pp-pill">{statusLabel(t, detail.status)}</span>
          {runningLabel !== null && <span className="pp-pill" data-tone="live">{t('running')} · {runningLabel}</span>}
          <span style={{ flex: 1 }} />
          <span className="pp-muted">{t('spent')} ¥{spent.toFixed(2)}</span>
          <Button size="sm" onClick={() => setExporting(true)}>{t('export')}</Button>
          <Button size="sm" onClick={() => setSettingsOpen(true)}>{t('settings')}</Button>
        </div>
      ) : (
        <>
      <div className="pp-page-nav">
        <BackButton label={t('back')} onClick={onBack} />
      </div>
      <Card className="pp-summary">
        <div className="pp-summary-top">
          <strong className="pp-project-title">{detail.name}</strong>
          <span className="pp-pill">{statusLabel(t, detail.status)}</span>
          {detail.sourceKind !== 'local' && (
            <span className="pp-chip">{detail.sourceOnline === false ? t('networkOffline') : t('smbConnected')}</span>
          )}
          {runningLabel !== null && <span className="pp-pill" data-tone="live">{t('running')} · {runningLabel}</span>}
          <span className="pp-path pp-summary-path" title={detail.sourcePath}>
            {detail.sourcePath}
          </span>
        </div>

        <div className="pp-stats">
          {statItems.map(item => (
            <div className="pp-stat" key={item.key}>
              <span className="pp-stat-value">{item.value}</span>
              <span className="pp-stat-label">
                {item.label}{item.hint !== undefined ? ` ${item.hint}` : ''}
              </span>
            </div>
          ))}
        </div>

        <ActionBar>
          <Button variant="primary" disabled={detail.running !== null} onClick={runAll}>
            {t('autoRun')}
          </Button>
          {detail.running !== null && (
            <Button onClick={() => run(detail.running, 'pause')}>{t('pause')}</Button>
          )}
          <div style={{ position: 'relative' }}>
            <Button onClick={() => setSingleStepsOpen(open => !open)}>
              {t('singleStep')} {singleStepsOpen ? '▴' : '▾'}
            </Button>
            {singleStepsOpen && (
              <div className="pp-menu">
                {stages.map(stage => (
                  <Button
                    key={stage}
                    disabled={aiDisabled && ['grid', 'rank', 'score'].includes(stage)}
                    onClick={() => { setSingleStepsOpen(false); run(stage) }}
                  >
                    {stage === 'scan' ? t('scan') : stage === 'preprocess' ? t('preprocess') : stageLabel(t, stage)}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <span style={{ flex: 1 }} />
          <Button onClick={() => setExporting(true)}>{t('export')}</Button>
          <Button onClick={() => setSettingsOpen(true)}>{t('settings')}</Button>
        </ActionBar>

        <div className="pp-steps">
          {stages.map(stage => {
            const status = stage === activeStage ? 'running' : (stageStatus[stage] ?? 'pending')
            return (
              <span className="pp-step" key={stage} title={runStatusLabel(t, status)}>
                <span className="pp-dot" data-status={status} />
                <strong>{stageLabel(t, stage)}</strong>
                <span>{runStatusLabel(t, status)}</span>
              </span>
            )
          })}
        </div>

        {detail.running !== null && (
          <div className="pp-progress">
            <div className="pp-muted">
              {activeStage !== undefined && activeStage !== null ? stageLabel(t, activeStage) : t('running')}
              {' '}{progress?.done ?? 0}/{progress?.total ?? '?'}
              {progress?.costCny !== undefined ? ` · ¥${Number(progress.costCny).toFixed(4)}` : ''}
            </div>
            <div className="pp-progress-track">
              <div className="pp-progress-fill" style={{ width: `${percent}%` }} />
            </div>
          </div>
        )}

        {pipelineEvent !== null && (
          <div className="pp-muted">
            {pipelineEvent.error !== undefined
              ? `${t('pipelineFailed')}: ${pipelineEvent.error}`
              : pipelineEvent.stage === 'pipeline' && pipelineEvent.result !== undefined
                ? `${pipelineEvent.result.reason === 'paused' ? t('pipelinePaused') : t('pipelineDone')}: ${(pipelineEvent.result.completed ?? []).map((stage: string) => stageLabel(t, stage)).join(' → ')}${pipelineEvent.result.stoppedAt !== null && pipelineEvent.result.stoppedAt !== undefined ? ` · ${t('nextStage')} ${stageLabel(t, pipelineEvent.result.stoppedAt)}` : ''}`
                : `${t('autoRun')}: ${stageLabel(t, pipelineEvent.stage)} · ${phaseLabel(t, pipelineEvent.phase)}`}
          </div>
        )}

        {aiDisabled && <div className="pp-callout">{t('aiDisabled')}</div>}
      </Card>
        </>
      )}

      {exporting && (
        <ExportDialog
          t={t}
          projectId={id}
          onClose={() => setExporting(false)}
          onDone={(result: any) => {
            setExporting(false)
            setExportNotice(t('exportDoneToast').replace('{count}', String(result.total ?? 0)))
          }}
        />
      )}
      {settingsOpen && (
        <SettingsDrawer
          t={t}
          detail={{ ...detail, id }}
          onClose={() => setSettingsOpen(false)}
          onSaved={refresh}
          onRunStage={(stage: string) => run(stage)}
        />
      )}

      {error !== null && <StateCard kind="error" title={t('errorTitle')} message={error} />}

      {(checkpoints.length > 0 || aiRuns.length > 0) && (
        <details className="pp-card pp-history pp-run-history">
          <summary>
            <span>{t('history')}</span>
            <span className="pp-muted pp-history-count">
              {checkpoints.filter(checkpoint => checkpoint.status === 'done').length} / {checkpoints.length}
            </span>
          </summary>
          <div className="pp-history-body">
            <div className="pp-run-tabs">
              <button type="button" className={runTab === 'checkpoints' ? 'active' : ''} onClick={() => setRunTab('checkpoints')}>{t('runTabCheckpoints')}</button>
              <button type="button" className={runTab === 'ai' ? 'active' : ''} onClick={() => setRunTab('ai')}>{t('runTabAi')}</button>
            </div>
            {runTab === 'checkpoints' ? (
              checkpoints.length > 0 ? checkpoints.map(checkpoint => (
                <div key={checkpoint.stage}>
                  <div className="pp-history-row">
                    <strong>{stageLabel(t, checkpoint.stage)}</strong>
                    <span className="pp-pill">{runStatusLabel(t, checkpoint.status)}</span>
                    <span className="pp-muted">{summarizeStats(t, checkpoint.stats)}</span>
                    <span className="pp-chip">¥{Number(checkpoint.costCny ?? 0).toFixed(4)}</span>
                  </div>
                  {(checkpoint.sampleIds ?? []).length > 0 && (
                    <details className="pp-history-samples">
                      <summary>{t('samples')} · {checkpoint.sampleIds.length}</summary>
                      <div>
                        {checkpoint.sampleIds.map((pid: string) => (
                          <img
                            key={pid}
                            src={`/photo-picker/media/thumb/${id}/${pid}?v=${version}`}
                            alt={pid}
                            loading="lazy"
                          />
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )) : <div className="pp-muted">{t('runHistoryEmpty')}</div>
            ) : aiRuns.length > 0 ? (
              <>
                {aiRuns.map(run => (
                  <div className="pp-run-ai-row" key={run.id}>
                    <div className="pp-history-row">
                      <strong>{stageLabel(t, run.stage)}</strong>
                      <span className="pp-pill">{runStatusLabel(t, run.status)}</span>
                      <span className="pp-muted">{run.modelId ?? t('aiRunsLegacy')}</span>
                      <span className="pp-muted">{run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'}</span>
                      <span className="pp-chip">¥{Number(run.costCny ?? 0).toFixed(4)}</span>
                    </div>
                    <div className="pp-run-meta">
                      <span>{t('aiRunTokens')} {run.tokensIn ?? 0} / {run.tokensOut ?? 0}</span>
                      <span>{t('aiRunCalls')} {run.callCount ?? 0}</span>
                      <span>{t('aiRunDuration')} {run.durationMs === null || run.durationMs === undefined ? '—' : `${Math.round(run.durationMs / 1000)}${t('secondsShort')}`}</span>
                      {run.errorCode !== null && run.errorCode !== undefined && <span>{run.errorCode}</span>}
                      <span>{summarizeStats(t, run.stats)}</span>
                    </div>
                  </div>
                ))}
                {aiRuns.length < aiRunsTotal && (
                  <Button size="sm" disabled={aiRunsLoading} onClick={() => { void loadMoreAiRuns() }}>
                    {aiRunsLoading ? t('loading') : t('loadMore')}
                  </Button>
                )}
              </>
            ) : <div className="pp-muted">{t('aiRunsEmpty')}</div>}
          </div>
        </details>
      )}

      <ReviewSection t={t} projectId={id} version={version} onChanged={refresh} onFocusChange={setFocusMode} />
      <CalibrationSection t={t} projectId={id} onApplied={refresh} />

      {pipelineNotice !== null && !noticeDismissed && (
        <div className="pp-toast" data-kind={pipelineNotice.kind} aria-live="polite">
          <span style={{ flex: 1 }}>{pipelineNotice.text}</span>
          <Button size="sm" variant="ghost" onClick={() => setNoticeDismissed(true)}>
            {t('close')}
          </Button>
        </div>
      )}

      {exportNotice !== null && (
        <div className="pp-toast" data-kind="done" aria-live="polite">
          <span style={{ flex: 1 }}>{exportNotice}</span>
          <Button size="sm" variant="ghost" onClick={() => setExportNotice(null)}>{t('close')}</Button>
        </div>
      )}
    </div>
  )
}


const GLOBAL_LAYOUT_PROJECT = 'project'
const GLOBAL_LAYOUT_FLAT = 'flat'

function GlobalExportDialog({ t, filters, selectedItems, onClose, onDone }: any) {
  const [dest, setDest] = useState('')
  const [buckets, setBuckets] = useState(['keep', 'maybe'])
  const [layout, setLayout] = useState('project')
  const [mode, setMode] = useState('hardlink')
  const [applyEdits, setApplyEdits] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [running, setRunning] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const progress = useVirtualExportProgress(running, preview)
  const selected = Array.isArray(selectedItems) ? selectedItems : []

  const choose = async () => {
    if (choosing) return
    setChoosing(true)
    try {
      const picked = await api('/photo-picker/api/fs/choose', { method: 'POST' })
      setDest(picked.path)
    } catch (cause) {
      setError(String(cause))
    } finally {
      setChoosing(false)
    }
  }

  const request = (action: 'preview' | 'run') => {
    const body: any = {
      dest,
      buckets,
      layout,
      mode: applyEdits ? 'copy' : mode,
      edit: applyEdits ? 'recipe' : 'none',
    }
    if (selected.length > 0) {
      body.items = selected.map((item: any) => ({ projectId: item.projectId, photoId: item.id }))
    } else {
      body.projectIds = filters.projectIds
      body.scenes = filters.scenes
      body.verdicts = filters.verdicts
    }
    return api(`/photo-picker/api/photos/export/${action}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  const execute = async (action: 'preview' | 'run') => {
    if (busy) return
    setBusy(true)
    if (action === 'run') setRunning(true)
    setError(null)
    try {
      const data = await request(action)
      if (action === 'preview') setPreview(data)
      else {
        setResult(data)
        setPreview(null)
        onDone?.(data)
      }
    } catch (cause) {
      setError(String(cause))
    } finally {
      setBusy(false)
      setRunning(false)
    }
  }

  const counts = preview?.counts ?? result?.counts ?? {}
  const scope = selected.length > 0
    ? t('exportScopeSelected').replace('{n}', String(selected.length))
    : t('exportScopeFiltered')

  return (
    <ModalShell title={t('globalExportTitle')} closeLabel={t('close')} onClose={onClose}>
      <div className="pp-form">
        <div className="pp-callout">{scope}</div>
        <label className="pp-field">
          <span>{t('exportDest')}</span>
          <div className="pp-row" style={{ alignItems: 'stretch' }}>
            <input
              value={dest}
              onChange={event => setDest(event.target.value)}
              placeholder={t('destPlaceholder')}
              className="pp-input"
              style={{ flex: 1 }}
            />
            <Button disabled={choosing} onClick={choose}>
              {choosing ? t('choosingFolder') : t('exportChoose')}
            </Button>
          </div>
        </label>
        <div className="pp-export-fields">
          <span className="pp-export-label">{t('exportBuckets')}</span>
          <div className="pp-option-group">
            {['keep', 'maybe', 'reject'].map(bucket => (
              <label key={bucket} className="pp-option">
                <input
                  type="checkbox"
                  disabled={selected.length > 0}
                  checked={buckets.includes(bucket)}
                  onChange={() => setBuckets(current => current.includes(bucket) ? current.filter(item => item !== bucket) : [...current, bucket])}
                />
                {verdictLabel(t, bucket)}
              </label>
            ))}
          </div>
          <span className="pp-export-label">{t('exportLayout')}</span>
          <div className="pp-option-group" role="radiogroup" aria-label={t('exportLayout')}>
            <label className="pp-option">
              <input type="radio" name="global-export-layout" value="project" checked={layout === 'project'} onChange={() => setLayout(GLOBAL_LAYOUT_PROJECT)} />
              {t('exportLayoutProject')}
            </label>
            <label className="pp-option">
              <input type="radio" name="global-export-layout" value="flat" checked={layout === 'flat'} onChange={() => setLayout(GLOBAL_LAYOUT_FLAT)} />
              {t('exportLayoutFlat')}
            </label>
          </div>
          <span className="pp-export-label">{t('exportMode')}</span>
          <div className="pp-option-group" role="radiogroup" aria-label={t('exportMode')}>
            <label className="pp-option">
              <input type="radio" name="global-export-mode" value="hardlink" checked={mode === 'hardlink'} onChange={() => setMode('hardlink')} />
              {t('exportHardlink')}
            </label>
            <label className="pp-option">
              <input type="radio" name="global-export-mode" value="copy" checked={mode === 'copy'} onChange={() => setMode('copy')} />
              {t('exportCopy')}
            </label>
          </div>
          <span className="pp-export-label" aria-hidden="true" />
          <div className="pp-option-group pp-option-group-span">
            <label className="pp-option">
              <input type="checkbox" checked={applyEdits} onChange={event => { setApplyEdits(event.target.checked); setPreview(null) }} />
              {t('applyEdits')}
            </label>
          </div>
        </div>
        {error !== null && <StateCard kind="error" title={t('errorTitle')} message={error} />}
        {preview !== null && (
          <div className="pp-export-summary">
            <div className="pp-row" style={{ flexWrap: 'wrap' }}>
              <span className="pp-chip">{t('exportPreview')} {preview.total ?? 0}</span>
              {Object.entries(counts).map(([bucket, count]) => (
                <span className="pp-chip" key={bucket}>{verdictLabel(t, bucket)} {String(count)}</span>
              ))}
              <span className="pp-muted">{t('exportSkipped')} {preview.skippedExisting ?? 0}</span>
              <span className="pp-muted">{t('exportConflict')} {preview.conflictCount ?? 0}</span>
              {preview.editedCount > 0 && <span className="pp-muted">{t('applyEdits')} {preview.editedCount}</span>}
            </div>
            {Object.keys(preview.byProject ?? {}).length > 0 && (
              <div className="pp-export-projects">
                {Object.values(preview.byProject ?? {}).map((entry: any) => (
                  <span className="pp-chip" key={entry.projectId}>{entry.projectName} {entry.total}</span>
                ))}
              </div>
            )}
          </div>
        )}
        {result !== null && (
          <div className="pp-callout">
            {t('exportResult')} {result.total ?? 0} · {t('manifest')} {result.manifestPath}
          </div>
        )}
        {running && <ExportProgress t={t} progress={progress} />}

        <div className="pp-actions">
          <Button disabled={busy || dest.trim() === ''} onClick={() => { void execute('preview') }}>
            {busy ? t('loading') : t('exportPreview')}
          </Button>
          <Button variant="primary" disabled={busy || dest.trim() === ''} onClick={() => { void execute('run') }}>
            {t('exportRun')}
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

function GlobalPhotoWall({ t, projects }: any) {
  const [projectIds, setProjectIds] = useState<string[]>([])
  const [scenes, setScenes] = useState<string[]>([])
  const [verdicts, setVerdicts] = useState<string[]>([])
  const [sort, setSort] = useState('score')
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [warnings, setWarnings] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [active, setActive] = useState<any>(null)
  const [exporting, setExporting] = useState(false)
  const [exportNotice, setExportNotice] = useState<string | null>(null)
  const requestRef = useRef(0)
  const filterKey = JSON.stringify({ projectIds, scenes, verdicts, sort })

  const fetchPage = async (offset: number) => {
    const params = new URLSearchParams({ limit: '120', offset: String(offset), sort })
    if (projectIds.length > 0) params.set('projects', projectIds.join(','))
    if (scenes.length > 0) params.set('scenes', scenes.join(','))
    if (verdicts.length > 0) params.set('verdicts', verdicts.join(','))
    return api(`/photo-picker/api/photos?${params.toString()}`)
  }

  const load = async (offset: number, append: boolean) => {
    const generation = ++requestRef.current
    if (append) setLoadingMore(true)
    else {
      setLoading(true)
      setSelected([])
      setActive(null)
    }
    try {
      const data = await fetchPage(offset)
      if (generation !== requestRef.current) return
      setItems(current => {
        const next = append ? [...current, ...(data.items ?? [])] : (data.items ?? [])
        const seen = new Set<string>()
        return next.filter((item: any) => {
          const key = `${item.projectId}:${item.id}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
      })
      setTotal(Number(data.total ?? 0))
      setWarnings(Array.isArray(data.warnings) ? data.warnings : [])
      setError(null)
    } catch (cause) {
      if (generation === requestRef.current) setError(String(cause))
    } finally {
      if (generation === requestRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }

  useEffect(() => { void load(0, false) }, [filterKey])

  const keyOf = (item: any) => `${item.projectId}:${item.id}`
  const selectedItems = items.filter(item => selected.includes(keyOf(item)))
  const toggleSelected = (item: any) => {
    const key = keyOf(item)
    setSelected(current => current.includes(key) ? current.filter(value => value !== key) : [...current, key])
  }
  const toggleProject = (id: string) => setProjectIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])
  const toggleScene = (id: string) => setScenes(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])
  const toggleVerdict = (id: string) => setVerdicts(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])
  const projectSummary = projectIds.length === 0
    ? t('allProjects')
    : t('selectedProjects').replace('{n}', String(projectIds.length))

  return (
    <section className="pp-global-wall">
      <div className="pp-global-toolbar">
        <div className="pp-toolbar-group">
          <span className="pp-section-title">{t('allPhotosTab')}</span>
          <details className="pp-project-picker">
            <summary>{projectSummary}</summary>
            <div className="pp-project-picker-menu">
              <label className="pp-project-picker-all">
                <input type="checkbox" checked={projectIds.length === 0} onChange={() => setProjectIds([])} />
                {t('allProjects')}
              </label>
              {(projects ?? []).map((project: any) => (
                <label key={project.id} title={project.name}>
                  <input type="checkbox" checked={projectIds.includes(project.id)} onChange={() => toggleProject(project.id)} />
                  <span className="pp-project-option">{project.name}</span>
                </label>
              ))}
            </div>
          </details>
          <label className="pp-toolbar-field">
            <span>{t('sortLabel')}</span>
            <select className="pp-select pp-select-sm" value={sort} onChange={event => setSort(event.target.value)}>
              <option value="score">{t('sortScore')}</option>
              <option value="score_asc">{t('sortScoreAsc')}</option>
              <option value="taken_at">{t('sortTaken')}</option>
              <option value="project">{t('sortProject')}</option>
            </select>
          </label>
          <span className="pp-muted">{total} {t('photos')}</span>
        </div>
        <div className="pp-toolbar-group pp-toolbar-end">
          <Button disabled={total === 0} onClick={() => setExporting(true)}>
            {selected.length > 0 ? t('exportSelected').replace('{n}', String(selected.length)) : t('exportFiltered')}
          </Button>
        </div>
      </div>

      <div className="pp-filter-chips">
        <span className="pp-filter-label">{t('sceneFilter')}</span>
        <button type="button" className={`pp-filter-chip${scenes.length === 0 ? ' active' : ''}`} onClick={() => setScenes([])}>{t('filterAll')}</button>
        {Object.keys(SCENE_KEYS).map(scene => (
          <button
            type="button"
            key={scene}
            className={`pp-filter-chip${scenes.includes(scene) ? ' active' : ''}`}
            onClick={() => toggleScene(scene)}
          >
            {sceneLabel(t, scene)}
          </button>
        ))}
      </div>
      <div className="pp-filter-chips">
        <span className="pp-filter-label">{t('verdictLabel')}</span>
        <button type="button" className={`pp-filter-chip${verdicts.length === 0 ? ' active' : ''}`} onClick={() => setVerdicts([])}>{t('filterAll')}</button>
        {['keep', 'maybe', 'reject'].map(verdict => (
          <button
            type="button"
            key={verdict}
            className={`pp-filter-chip${verdicts.includes(verdict) ? ' active' : ''}`}
            onClick={() => toggleVerdict(verdict)}
          >
            {verdictLabel(t, verdict)}
          </button>
        ))}
      </div>

      {warnings.length > 0 && (
        <div className="pp-callout">
          {warnings.map((warning: any) => `${warning.projectId}: ${warning.message}`).join(' · ')}
        </div>
      )}
      {error !== null && <div className="pp-error">{error} <Button size="sm" onClick={() => { void load(0, false) }}>{t('retry')}</Button></div>}

      {loading && items.length === 0 ? (
        <StateCard kind="loading" title={t('loading')} />
      ) : items.length === 0 ? (
        <StateCard kind="empty" title={t('globalWallEmpty')} action={<Button onClick={() => { setProjectIds([]); setScenes([]); setVerdicts([]) }}>{t('clearFilters')}</Button>} />
      ) : (
        <>
          <div className="pp-global-grid">
            {items.map(item => {
              const key = keyOf(item)
              const sceneText = (item.scenes ?? []).map((scene: string) => sceneLabel(t, scene)).join(' · ')
              return (
                <div className="pp-tile-wrap" key={key}>
                  <button
                    type="button"
                    className={`pp-tile${selected.includes(key) ? ' selected' : ''}`}
                    title={`${item.projectName} · ${item.relPath}`}
                    onClick={() => setActive(item)}
                  >
                    <img src={`${item.thumbUrl}?v=${item.projectUpdatedAt ?? 0}`} alt={item.relPath} loading="lazy" />
                    <span className="pp-tile-bar" style={{ background: VERDICT_COLORS[item.verdict] ?? 'var(--dsw-alias-border-l2)' }} />
                    {item.score !== null && <span className="pp-tile-score">{Number(item.score).toFixed(1)}</span>}
                    <span className="pp-global-project">{item.projectName}</span>
                    {sceneText !== '' && <span className="pp-tile-scenes">{sceneText}</span>}
                  </button>
                  <input
                    className="pp-check"
                    type="checkbox"
                    checked={selected.includes(key)}
                    onChange={() => toggleSelected(item)}
                    aria-label={`${item.projectName} ${item.relPath}`}
                  />
                </div>
              )
            })}
          </div>
          <div className="pp-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="pp-muted">{selected.length > 0 ? `${t('selectedCount')} ${selected.length}` : ''}</span>
            <div className="pp-row">
              {selected.length > 0 && <Button size="sm" variant="ghost" onClick={() => setSelected([])}>{t('clearSelection')}</Button>}
              <Button size="sm" variant="ghost" onClick={() => setSelected(items.map(keyOf))}>{t('selectLoaded')}</Button>
              {items.length < total && (
                <Button size="sm" disabled={loadingMore} onClick={() => { void load(items.length, true) }}>
                  {loadingMore ? t('loading') : t('loadMore')}
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {active !== null && (
        <ModalShell title={active.projectName} closeLabel={t('close')} onClose={() => setActive(null)}>
          <div className="pp-global-lightbox">
            <img src={`${active.previewUrl}?v=${active.projectUpdatedAt ?? 0}`} alt={active.relPath} />
            <div className="pp-muted">{active.relPath}</div>
            <div className="pp-row" style={{ flexWrap: 'wrap' }}>
              <span className="pp-chip">{active.projectName}</span>
              <span className="pp-pill">{verdictLabel(t, active.verdict)}</span>
              {active.score !== null && <span className="pp-chip">{t('scoreLabel')} {Number(active.score).toFixed(1)}</span>}
              {(active.scenes ?? []).map((scene: string) => <span key={scene} className="pp-chip">{sceneLabel(t, scene)}</span>)}
            </div>
          </div>
        </ModalShell>
      )}
      {exporting && (
        <GlobalExportDialog
          t={t}
          filters={{ projectIds, scenes, verdicts }}
          selectedItems={selectedItems}
          onClose={() => setExporting(false)}
          onDone={(result: any) => {
            setExporting(false)
            setExportNotice(t('exportDoneToast').replace('{count}', String(result.total ?? 0)))
          }}
        />
      )}

      {exportNotice !== null && (
        <div className="pp-toast" data-kind="done" aria-live="polite">
          <span style={{ flex: 1 }}>{exportNotice}</span>
          <Button size="sm" variant="ghost" onClick={() => setExportNotice(null)}>{t('close')}</Button>
        </div>
      )}
    </section>
  )
}

function Workbench({ t }: { t: (key: string) => string }) {
  // 订阅语言变化：切换语言后立即重渲染整棵面板。
  useSyncExternalStore(subscribeLanguage, getLanguage)
  const [projects, setProjects] = useState<any[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [view, setView] = useState<'projects' | 'global'>('projects')
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = async () => {
    try {
      setProjects(await api('/photo-picker/api/projects'))
      setError(null)
    } catch (cause) {
      setProjects([])
      setError(String(cause))
    }
  }

  useEffect(() => { reload() }, [])

  const deleteProject = async (project: any) => {
    if (!window.confirm(t('deleteProjectConfirm').replace('{name}', project.name))) return
    setDeleting(project.id)
    setError(null)
    try {
      await api(`/photo-picker/api/projects/${project.id}`, { method: 'DELETE' })
      await reload()
    } catch (cause) {
      setError(String(cause))
    } finally {
      setDeleting(null)
    }
  }

  const list = projects ?? []

  return (
    <div className="pp-page">
      <div className="pp-shell">
        <header className="pp-header">
          <div className="pp-title-wrap">
            <span className="pp-mark" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 3.9 16.15 8.3l-1.55 5.25h-5.2L7.85 8.3 12 3.9Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </span>
            <div>
              <h1 className="pp-title">{t('title')}</h1>
              <p className="pp-subtitle">{t('subtitle')}</p>
            </div>
          </div>
          <div className="pp-header-actions">
            <button
              type="button"
              className="pp-lang"
              title={t('language')}
              onClick={() => setLanguage(getLanguage() === 'zh' ? 'en' : 'zh')}
            >
              {getLanguage() === 'zh' ? 'EN' : '中'}
            </button>
            {view === 'projects' && (
              <Button variant="primary" onClick={() => { setCreating(true); setSelected(null) }}>
                {t('newProject')}
              </Button>
            )}
          </div>
        </header>

        <div className="pp-view-tabs">
          <button type="button" className={view === 'projects' && selected === null ? 'active' : ''} onClick={() => { setView('projects'); setSelected(null); setCreating(false) }}>{t('projectsTab')}</button>
          <button type="button" className={view === 'global' ? 'active' : ''} onClick={() => { setView('global'); setSelected(null); setCreating(false) }}>{t('allPhotosTab')}</button>
        </div>

        {error !== null && <StateCard kind="error" title={t('errorTitle')} message={error} />}

        {selected !== null ? (
          <ProjectDetail t={t} id={selected} onBack={() => setSelected(null)} />
        ) : view === 'global' ? (
          <GlobalPhotoWall t={t} projects={list} />
        ) : creating ? (
          <CreateForm
            t={t}
            onCreated={id => { setCreating(false); setSelected(id); void reload() }}
            onCancel={() => setCreating(false)}
          />
        ) : projects === null ? (
          <StateCard kind="loading" title={t('loading')} />
        ) : list.length === 0 ? (
          <StateCard
            kind="empty"
            title={t('empty')}
            message={t('subtitle')}
            action={<Button variant="primary" onClick={() => setCreating(true)}>{t('newProject')}</Button>}
          />
        ) : (
          <div className="pp-projects">
            {list.map(project => (
              <div className="pp-project-wrap" key={project.id}>
                <button
                  type="button"
                  className="pp-project"
                  onClick={() => setSelected(project.id)}
                >
                  <span className="pp-project-top">
                    <strong className="pp-project-name">{project.name}</strong>
                    <span className="pp-pill">{statusLabel(t, project.status)}</span>
                    <span className="pp-chevron">→</span>
                  </span>
                  <span className="pp-project-path" title={project.sourcePath}>{project.sourcePath}</span>
                  <span className="pp-project-meta">
                    <span className="pp-chip">
                      {Object.values(project.counts ?? {}).reduce((sum: number, n: any) => sum + Number(n ?? 0), 0)} {t('photos')}
                    </span>
                    {Object.entries(project.counts ?? {}).map(([state, n]) => (
                      <span className="pp-chip" key={state}>{stateLabel(t, state)} {String(n)}</span>
                    ))}
                    <span className="pp-project-spent">{t('spent')} ¥{Number(project.cost?.spentCny ?? 0).toFixed(4)}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="pp-project-delete"
                  aria-label={t('deleteProject')}
                  title={t('deleteProject')}
                  disabled={deleting === project.id}
                  onClick={() => { void deleteProject(project) }}
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 4.5h10M6 4.5V3h4v1.5M4.5 4.5l.6 8.2a1 1 0 0 0 1 .8h3.8a1 1 0 0 0 1-.8l.6-8.2M6.5 7v4M9.5 7v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** 侧栏入口图标：与其它面板行一样，图标是行的直接子元素。 */
function PhotoPickerIcon({ size }: { size?: number; active?: boolean }) {
  const edge = size ?? 16
  return (
    <svg width={edge} height={edge} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3.9 16.15 8.3l-1.55 5.25h-5.2L7.85 8.3 12 3.9Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export const inject = ['slots', 'locale']

export function apply(ctx: any) {
  installStyles()
  // 界面语言跟随浏览器（可在设置里覆盖），不依赖 DSH 语言设置。
  const t = (key: string) => translate(getLanguage(), key)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'photo-picker.locale')
  ctx.slots.inject('main', () => ctx.slots.register(
    { name: 'main', key: PANEL_ID },
    () => <Workbench t={t} />,
  ))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
    { name: 'sidebar.panellist', id: PANEL_ID, order: 20, label: () => t('title') },
    PhotoPickerIcon,
  ))
}
