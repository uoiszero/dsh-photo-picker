import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react'

// esbuild 用 jsxFactory: 'h' 编译 JSX；Fragment 用于多根节点。
const h = React.createElement
const Fragment = React.Fragment

const NS = 'photoPicker'
const PANEL_ID = 'photo-picker'

import { getLanguage, setLanguage, subscribeLanguage, translate, zh, en } from './locales.js'
import { installStyles } from './theme.js'
import { computeColumns, computeRowHeight, computeVisibleRows, TILE_GAP, TILE_MIN, TILE_MIN_NARROW } from './virtual.js'
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

function ReviewSection({ t, projectId, version, onChanged }: {
  t: (key: string) => string
  projectId: string
  version: number
  onChanged?: () => void
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

function PhotoSingle({ t, projectId, items, photoId, version, onNavigate, onNeedMore, onOpenGroup, onDecide, onClose }: any) {
  const [detail, setDetail] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showEdited, setShowEdited] = useState(false)
  const [editedFailed, setEditedFailed] = useState(false)
  const [showGrid, setShowGrid] = useState(() => storedGuide('photoPicker.gridGuide'))
  const [showCross, setShowCross] = useState(() => storedGuide('photoPicker.crossGuide'))
  const [deciding, setDeciding] = useState(false)

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
    loadDetail().catch(cause => setError(String(cause)))
  }, [photoId])

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
  }, [photoId, index, items, detail, deciding])

  if (error !== null) return <StateCard kind="error" title={t('errorTitle')} message={error} />
  if (detail === null) return <StateCard kind="loading" title={t('loading')} />

  const dimensions = detail.dimensions ?? {}
  const recipe = detail.editRecipe ?? null
  const editedUrl = `/photo-picker/media/edit/${projectId}/${photoId}?v=${version}&e=${detail.editSignature ?? 'none'}`
  const canCompare = recipe !== null && !editedFailed
  const showingEdited = showEdited && canCompare
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
        <div className="pp-stage">
          <div className="pp-stage-frame">
            <img
              src={showingEdited ? editedUrl : `${detail.previewUrl}?v=${version}`}
              alt={detail.relPath}
              onError={() => { if (showingEdited) setEditedFailed(true) }}
            />
            {sceneText !== '' && <span className="pp-stage-scenes" title={sceneText}>{sceneText}</span>}
            {showGrid && (
              <div className="pp-guide pp-guide-grid" aria-hidden="true">
                <span className="v" style={{ left: '33.333%' }} />
                <span className="v" style={{ left: '66.666%' }} />
                <span className="h" style={{ top: '33.333%' }} />
                <span className="h" style={{ top: '66.666%' }} />
              </div>
            )}
            {showCross && (
              <div className="pp-guide pp-guide-cross" aria-hidden="true">
                <span className="v" style={{ left: '50%' }} />
                <span className="h" style={{ top: '50%' }} />
              </div>
            )}
            <div className="pp-stage-tools">
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
            </div>
            {canCompare && (
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
        <aside className="pp-card pp-panel">
          <div className="pp-row" style={{ gap: 6 }}>
            <Button style={{ flex: 1 }} disabled={deciding} onClick={() => decide('keep')}>{t('keep')}</Button>
            <Button style={{ flex: 1 }} disabled={deciding} onClick={() => decide('maybe')}>{t('maybe')}</Button>
            <Button variant="danger" style={{ flex: 1 }} disabled={deciding} onClick={() => decide('reject')}>{t('reject')}</Button>
          </div>
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
                {detail.postProcessing.map((code: string) => <span key={code} className="pp-chip">{code}</span>)}
              </div>
            </div>
          )}
          <div>
            <div className="pp-section-title" style={{ marginBottom: 6 }}>{t('editRecipe')}</div>
            {recipe !== null ? (
              <div className="pp-chips">
                <span className="pp-chip">
                  {t('editCrop')}: {recipe.crop.width === 1 && recipe.crop.height === 1
                    ? t('editCropNone')
                    : `${t('editCropKeep')} ${Math.round(recipe.crop.width * 100)}% × ${Math.round(recipe.crop.height * 100)}% · ${t('editCropLeft')} ${Math.round(recipe.crop.left * 100)}% · ${t('editCropTop')} ${Math.round(recipe.crop.top * 100)}%`}
                </span>
                <span className="pp-chip">{t('editRotate')} {recipe.rotate}°</span>
                <span className="pp-chip">{t('editExposure')} {recipe.exposureEv > 0 ? '+' : ''}{recipe.exposureEv} EV</span>
                <span className="pp-chip">{t('editContrast')} {recipe.contrast}</span>
                <span className="pp-chip">{t('editSaturation')} {recipe.saturation}</span>
                <span className="pp-chip">{t('editSharpen')} {recipe.sharpen}</span>
              </div>
            ) : (
              <div className="pp-muted">{t('editNoRecipe')}</div>
            )}
          </div>
          <div className="pp-muted">
            {detail.width} × {detail.height}
            {detail.group !== undefined ? ` · ${t('groupRank').replace('{rank}', String(detail.group.rank)).replace('{size}', String(detail.group.size))}` : ''}
          </div>
        </aside>
      </div>
    </section>
  )
}

function ExportDialog({ t, projectId, onClose }: { t: (key: string) => string; projectId: string; onClose: () => void }) {
  const [dest, setDest] = useState('')
  const [buckets, setBuckets] = useState(['keep', 'maybe'])
  const [mode, setMode] = useState('hardlink')
  const [applyEdits, setApplyEdits] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      }
    } catch (cause) {
      setError(String(cause))
    } finally {
      setBusy(false)
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
          <div className="pp-row" style={{ alignItems: 'center' }}>
            <span className="pp-muted">{t('exportBuckets')}</span>
            {['keep', 'maybe', 'reject'].map(bucket => (
              <label key={bucket} className="pp-chip" style={{ cursor: 'pointer', gap: 6 }}>
                <input type="checkbox" checked={buckets.includes(bucket)} onChange={() => toggleBucket(bucket)} />
                {verdictLabel(t, bucket)}
              </label>
            ))}
            <span className="pp-muted" style={{ marginLeft: 8 }}>{t('exportMode')}</span>
            <select
              value={applyEdits ? 'copy' : mode}
              disabled={applyEdits}
              onChange={event => setMode(event.target.value)}
              className="pp-select pp-select-sm"
            >
              <option value="hardlink">{t('exportHardlink')}</option>
              <option value="copy">{t('exportCopy')}</option>
            </select>
          </div>
          <div className="pp-checks">
            <label>
              <input type="checkbox" checked={applyEdits} onChange={event => toggleEdits(event.target.checked)} />
              {t('editExport')}
            </label>
          </div>
          {applyEdits && <div className="pp-callout">{t('editExportHint')}</div>}
        </div>

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
  const [models, setModels] = useState<any[]>([])
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api(`/photo-picker/api/prompt?project=${detail.id}`).then(setPrompt).catch(() => {})
    api(`/photo-picker/api/models?route=${encodeURIComponent(detail.modelRoute ?? 'deepseek-official')}`)
      .then(data => setModels(data.models ?? []))
      .catch(() => {})
  }, [detail.id])

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
  const [noticeDismissed, setNoticeDismissed] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    try {
      const [project, points, statistics] = await Promise.all([
        api(`/photo-picker/api/projects/${id}`),
        api(`/photo-picker/api/projects/${id}/checkpoints`),
        api(`/photo-picker/api/projects/${id}/stats`),
      ])
      setDetail(project)
      setCheckpoints(points)
      setStats(statistics)
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
    <div className="pp-detail">
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

      {exporting && <ExportDialog t={t} projectId={id} onClose={() => setExporting(false)} />}
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

      {checkpoints.length > 0 && (
        <details className="pp-card pp-history">
          <summary>
            <span>{t('history')}</span>
            <span className="pp-muted pp-history-count">
              {checkpoints.filter(checkpoint => checkpoint.status === 'done').length} / {checkpoints.length}
            </span>
          </summary>
          <div className="pp-history-body">
            {checkpoints.map(checkpoint => (
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
            ))}
          </div>
        </details>
      )}

      <ReviewSection t={t} projectId={id} version={version} onChanged={refresh} />
      <CalibrationSection t={t} projectId={id} onApplied={refresh} />

      {pipelineNotice !== null && !noticeDismissed && (
        <div className="pp-toast" data-kind={pipelineNotice.kind} aria-live="polite">
          <span style={{ flex: 1 }}>{pipelineNotice.text}</span>
          <Button size="sm" variant="ghost" onClick={() => setNoticeDismissed(true)}>
            {t('close')}
          </Button>
        </div>
      )}
    </div>
  )
}

function Workbench({ t }: { t: (key: string) => string }) {
  // 订阅语言变化：切换语言后立即重渲染整棵面板。
  useSyncExternalStore(subscribeLanguage, getLanguage)
  const [projects, setProjects] = useState<any[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
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
            <Button variant="primary" onClick={() => { setCreating(true); setSelected(null) }}>
              {t('newProject')}
            </Button>
          </div>
        </header>

        {error !== null && <StateCard kind="error" title={t('errorTitle')} message={error} />}

        {selected !== null ? (
          <ProjectDetail t={t} id={selected} onBack={() => setSelected(null)} />
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
              <button
                type="button"
                className="pp-project"
                key={project.id}
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
