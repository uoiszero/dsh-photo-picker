import React, { useEffect, useState, useSyncExternalStore } from 'react'

// esbuild 用 jsxFactory: 'h' 编译 JSX；Fragment 用于多根节点。
const h = React.createElement
const Fragment = React.Fragment

const NS = 'photoPicker'
const PANEL_ID = 'photo-picker'

import { getLanguage, setLanguage, subscribeLanguage, translate, zh, en } from './locales.js'
import { installStyles } from './theme.js'


const btn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  background: 'var(--dsw-alias-bg-layer-1)',
  color: 'var(--dsw-alias-label-primary)',
  border: '1px solid var(--dsw-alias-border-l1)',
  borderRadius: 10,
  padding: '7px 13px',
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.3,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const btnPrimary = {
  ...btn,
  background: 'var(--dsw-alias-button-primary-fill)',
  color: 'var(--dsw-alias-label-primary-foreground)',
  border: '1px solid transparent',
  fontWeight: 600,
}

const input = {
  background: 'var(--dsw-alias-bg-base)',
  color: 'var(--dsw-alias-label-primary)',
  border: '1px solid var(--dsw-alias-border-l1)',
  borderRadius: 9,
  padding: '7px 10px',
  fontSize: 13,
  minWidth: 0,
}

const muted = { color: 'var(--dsw-alias-label-secondary)', fontSize: 12 }

const chip = {
  display: 'inline-flex',
  alignItems: 'center',
  background: 'var(--dsw-alias-bg-layer-2)',
  borderRadius: 999,
  padding: '2px 9px',
  fontSize: 11,
  color: 'var(--dsw-alias-label-secondary)',
  lineHeight: 1.6,
  whiteSpace: 'nowrap',
}

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
  const [folder, setFolder] = useState('')
  const [dirs, setDirs] = useState<{ name: string; path: string }[]>([])
  const [name, setName] = useState('')
  const [theme, setTheme] = useState('mixed')
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

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      const project = await api('/photo-picker/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          source: { kind: 'local', path: folder },
          name: name === '' ? undefined : name,
          theme,
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
        <label className="pp-field">
          <span>{t('folder')}</span>
          <div className="pp-row" style={{ alignItems: 'stretch' }}>
            <input
              value={folder}
              onChange={event => setFolder(event.target.value)}
              placeholder="/Users/…/Pictures"
              style={{ ...input, flex: 1 }}
            />
            <button type="button" style={btn} disabled={choosing} onClick={choose}>
              {choosing ? t('choosingFolder') : t('choose')}
            </button>
            <button type="button" style={btn} onClick={() => browse(folder)}>{t('browse')}</button>
          </div>
        </label>
        {dirs.length > 0 && (
          <div className="pp-card" style={{ maxHeight: 220, overflow: 'auto', padding: 4 }}>
            {dirs.map(dir => (
              <div
                key={dir.path}
                onClick={() => browse(dir.path)}
                style={{ padding: '7px 10px', cursor: 'pointer', fontSize: 13, borderRadius: 8 }}
              >
                {dir.name}
              </div>
            ))}
          </div>
        )}
        <label className="pp-field">
          <span>{t('name')}</span>
          <input value={name} onChange={event => setName(event.target.value)} placeholder={t('namePlaceholder')} style={input} />
        </label>
        <div className="pp-row">
          <label className="pp-field">
            <span>{t('theme')}</span>
            <select value={theme} onChange={event => setTheme(event.target.value)} style={input}>
              <option value="mixed">{t('themeMixed')}</option>
              <option value="portrait">{t('themePortrait')}</option>
              <option value="landscape">{t('themeLandscape')}</option>
              <option value="event">{t('themeEvent')}</option>
            </select>
          </label>
          <label className="pp-field" style={{ maxWidth: 140 }}>
            <span>{t('budget')}</span>
            <input value={budget} onChange={event => setBudget(event.target.value)} style={input} />
          </label>
        </div>
        <div className="pp-actions">
          <button type="button" style={btnPrimary} disabled={busy || folder === ''} onClick={create}>
            {busy ? t('creating') : t('create')}
          </button>
          <button type="button" style={btn} onClick={onCancel}>{t('back')}</button>
        </div>
        {error !== null && <div className="pp-error">{error}</div>}
      </div>
    </div>
  )
}

const VERDICT_COLORS: Record<string, string> = {
  keep: 'var(--dsw-static-green-500, #2f9e5f)',
  maybe: 'var(--dsw-static-amber-500, #d09a2b)',
  reject: 'var(--dsw-static-red-500, #cc4b3f)',
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
  const [items, setItems] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('score')
  const [selected, setSelected] = useState<string[]>([])
  const [undo, setUndo] = useState<any[]>([])
  const [single, setSingle] = useState<string | null>(null)
  const [groupView, setGroupView] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const params = new URLSearchParams({ scope: 'review', sort, limit: '200' })
    if (filter !== 'all') params.set('verdict', filter)
    const data = await api(`/photo-picker/api/projects/${projectId}/photos?${params.toString()}`)
    setItems(data.items)
    setSelected(current => current.filter(id => data.items.some((item: any) => item.id === id)))
  }

  useEffect(() => {
    load().catch(cause => setError(String(cause)))
  }, [filter, sort, version])

  const decide = async (photoIds: string[], verdict: string) => {
    if (photoIds.length === 0) return
    const previous: Record<string, string | null> = {}
    for (const item of items) if (photoIds.includes(item.id)) previous[item.id] = item.humanVerdict
    try {
      await api(`/photo-picker/api/projects/${projectId}/decisions`, {
        method: 'POST',
        body: JSON.stringify({ photoIds, verdict }),
      })
      setUndo(stack => [{ previous }, ...stack].slice(0, 20))
      setSelected([])
      await load()
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
      }
      setUndo(stack => stack.slice(1))
      await load()
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
        onDecided={async () => { await load(); onChanged?.() }}
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
        <span className="pp-section-title">{t('review')}</span>
        <div className="pp-seg">
          {filters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? 'active' : ''}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <select value={sort} onChange={event => setSort(event.target.value)} style={{ ...input, padding: '5px 8px', fontSize: 12 }}>
          <option value="score">{t('sortScore')}</option>
          <option value="score_asc">{t('sortScoreAsc')}</option>
          <option value="group">{t('sortGroup')}</option>
          <option value="taken_at">{t('sortTaken')}</option>
          <option value="rel_path">{t('sortPath')}</option>
        </select>
        <span className="pp-muted" style={{ marginLeft: 'auto' }}>{items.length} {t('photos')}</span>
        <button type="button" style={btn} disabled={undo.length === 0} onClick={undoLast}>{t('undoAction')}</button>
      </div>

      {error !== null && <div className="pp-error">{error}</div>}

      {items.length === 0 ? (
        <div className="pp-empty" style={{ padding: '44px 20px' }}>
          <h2>{t('reviewEmpty')}</h2>
          {filter !== 'all' && (
            <button type="button" style={btn} onClick={() => setFilter('all')}>{t('filterAll')}</button>
          )}
        </div>
      ) : (
        <div className="pp-wall">
          {items.map(item => (
            <div className="pp-tile-wrap" key={item.id}>
              <button
                type="button"
                className={`pp-tile${selected.includes(item.id) ? ' selected' : ''}`}
                title={item.relPath}
                onClick={() => setSingle(item.id)}
              >
                <img src={`${item.thumbUrl}?v=${version}`} alt={item.relPath} loading="lazy" />
                <span
                  className="pp-tile-bar"
                  style={{ background: VERDICT_COLORS[item.verdict] ?? 'var(--dsw-alias-border-l2)' }}
                />
                {item.score !== null && <span className="pp-tile-score">{Number(item.score).toFixed(1)}</span>}
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
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="pp-batch">
          <span className="pp-muted">{t('selectedCount')} {selected.length}</span>
          <button type="button" style={btn} onClick={() => decide(selected, 'keep')}>{t('keep')}</button>
          <button type="button" style={btn} onClick={() => decide(selected, 'maybe')}>{t('maybe')}</button>
          <button type="button" style={btn} onClick={() => decide(selected, 'reject')}>{t('reject')}</button>
          <button type="button" style={btn} onClick={() => setSelected([])}>{t('clearSelection')}</button>
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

function PhotoSingle({ t, projectId, items, photoId, version, onNavigate, onOpenGroup, onDecide, onClose }: any) {
  const [detail, setDetail] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showEdited, setShowEdited] = useState(false)
  const [editedFailed, setEditedFailed] = useState(false)
  const [showGrid, setShowGrid] = useState(() => storedGuide('photoPicker.gridGuide'))
  const [showCross, setShowCross] = useState(() => storedGuide('photoPicker.crossGuide'))

  useEffect(() => {
    setDetail(null)
    setShowEdited(false)
    setEditedFailed(false)
    api(`/photo-picker/api/projects/${projectId}/photos/${photoId}`)
      .then(setDetail)
      .catch(cause => setError(String(cause)))
  }, [photoId])

  const index = items.findIndex((item: any) => item.id === photoId)
  const move = (delta: number) => {
    const next = items[index + delta]
    if (next !== undefined) onNavigate(next.id)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target !== null && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === 'j' || event.key === 'ArrowRight') move(1)
      else if (event.key === 'k' || event.key === 'ArrowLeft') move(-1)
      else if (event.key === 'p') onDecide([photoId], 'keep')
      else if (event.key === 'm') onDecide([photoId], 'maybe')
      else if (event.key === 'x') onDecide([photoId], 'reject')
      else if (event.key === 'g' && detail?.group !== undefined) onOpenGroup(detail.group.id)
      else if (event.key === ' ' || event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [photoId, index, items, detail])

  if (error !== null) return <div style={{ color: 'var(--dsw-alias-state-danger-primary, #d0453a)', fontSize: 12 }}>{error}</div>
  if (detail === null) return <div style={{ ...muted, fontSize: 13 }}>{t('loading')}</div>

  const dimensions = detail.dimensions ?? {}
  const recipe = detail.editRecipe ?? null
  const editedUrl = `/photo-picker/media/edit/${projectId}/${photoId}?v=${version}`
  const canCompare = recipe !== null && !editedFailed
  const showingEdited = showEdited && canCompare
  return (
    <section className="pp-single">
      <div className="pp-single-head">
        <button type="button" style={btn} onClick={onClose}>← {t('backToWall')}</button>
        {detail.group !== undefined && (
          <button type="button" style={btn} onClick={() => onOpenGroup(detail.group.id)}>{t('groupCompare')}</button>
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
            <button type="button" style={{ ...btn, flex: 1 }} onClick={() => onDecide([photoId], 'keep')}>{t('keep')}</button>
            <button type="button" style={{ ...btn, flex: 1 }} onClick={() => onDecide([photoId], 'maybe')}>{t('maybe')}</button>
            <button type="button" style={{ ...btn, flex: 1 }} onClick={() => onDecide([photoId], 'reject')}>{t('reject')}</button>
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
                <span className="pp-chip">{t('editCrop')} {Math.round(recipe.crop.width * 100)}% × {Math.round(recipe.crop.height * 100)}%</span>
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
    <div className="pp-overlay" onClick={onClose}>
      <div className="pp-modal" onClick={event => event.stopPropagation()}>
        <div className="pp-modal-head">
          <span>{t('exportTitle')}</span>
          <button type="button" style={btn} onClick={onClose}>{t('close')}</button>
        </div>

        <div className="pp-form">
          <label className="pp-field">
            <span>{t('exportDest')}</span>
            <div className="pp-row" style={{ alignItems: 'stretch' }}>
              <input
                value={dest}
                onChange={event => setDest(event.target.value)}
                placeholder={t('destPlaceholder')}
                style={{ ...input, flex: 1 }}
              />
              <button type="button" style={btn} disabled={choosing} onClick={choose}>
                {choosing ? t('choosingFolder') : t('exportChoose')}
              </button>
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
              style={{ ...input, padding: '4px 8px', fontSize: 12 }}
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
          <button type="button" style={btn} disabled={busy || dest === ''} onClick={() => execute('preview')}>{t('exportPreview')}</button>
          <button type="button" style={btnPrimary} disabled={busy || dest === '' || preview === null} onClick={() => execute('run')}>{t('exportRun')}</button>
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
              <button
                type="button"
                style={btn}
                onClick={() => api('/photo-picker/api/fs/reveal', {
                  method: 'POST',
                  body: JSON.stringify({ path: result.manifestPath ?? dest }),
                }).catch(cause => setError(String(cause)))}
              >
                {t('revealInFinder')}
              </button>
            </div>
            {result.failureCount > 0 && <div className="pp-error" style={{ marginTop: 4 }}>{t('exportConflict')}: {result.failureCount}</div>}
          </div>
        )}
      </div>
    </div>
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

  if (error !== null) return <div style={{ color: 'var(--dsw-alias-state-danger-primary, #d0453a)', fontSize: 12 }}>{error}</div>
  if (detail === null) return <div style={{ ...muted, fontSize: 13 }}>{t('loading')}</div>

  const kindLabel = detail.kind === 'burst' ? t('groupKindBurst') : t('groupKindScene')
  const pageCount = Math.max(1, Math.ceil(detail.members.length / 6))
  const pageStart = page * 6
  const visible = detail.members.slice(pageStart, pageStart + 6)
  return (
    <section className="pp-single">
      <div className="pp-single-head">
        <button type="button" style={btn} onClick={onClose}>← {t('backToWall')}</button>
        <span className="pp-chip">{kindLabel}</span>
        <span className="pp-chip">{detail.size} {t('photos')}</span>
        {pageCount > 1 && <span className="pp-chip">{page + 1} / {pageCount}</span>}
        <span className="pp-muted">{index >= 0 ? `${index + 1} / ${groups.length}` : ''}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {pageCount > 1 && (
            <>
              <button type="button" style={btn} disabled={page === 0} onClick={() => { setPage(page - 1); setSelected(pageStart - 6) }}>‹</button>
              <button type="button" style={btn} disabled={page >= pageCount - 1} onClick={() => { setPage(page + 1); setSelected(pageStart + 6) }}>›</button>
            </>
          )}
          <button type="button" style={btn} disabled={index <= 0} onClick={() => switchGroup(-1)}>←</button>
          <button type="button" style={btn} disabled={index < 0 || index >= groups.length - 1} onClick={() => switchGroup(1)}>→</button>
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
        <button type="button" style={btnPrimary} disabled={busy} onClick={confirm}>{t('groupConfirm')}</button>
        <button type="button" style={btn} disabled={busy} onClick={() => decide('reject', detail.members.map((member: any) => member.id))}>
          {t('groupRejectAll')}
        </button>
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
    <div style={{ display: 'grid', gap: 12 }}>
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
        <button type="button" style={btn} disabled={busy} onClick={apply}>
          {applied ? t('calibrationApplied') : t('calibrationApply')}
        </button>
      </div>
    </div>
  )

  return (
    <section className="pp-card pp-panel">
      <div className="pp-row" style={{ alignItems: 'center' }}>
        <div className="pp-section-title">{t('calibration')}</div>
        <button type="button" style={btn} disabled={busy} onClick={start}>{t('calibrationStart')}</button>
        {phase === 'idle' && latest?.metrics !== null && latest?.metrics !== undefined && (
          <span className="pp-muted" style={{ marginLeft: 'auto' }}>{t('calibrationLast')}: {latest.sampleSize} {t('photos')}</span>
        )}
      </div>

      {error !== null && <div className="pp-error">{error}</div>}

      {phase === 'idle' && latest?.metrics !== null && latest?.metrics !== undefined && summary(latest.metrics)}

      {phase === 'blind' && items[index] !== undefined && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="pp-row" style={{ alignItems: 'center' }}>
            <span className="pp-chip">{t('calibrationProgress').replace('{n}', String(index + 1)).replace('{total}', String(items.length))}</span>
            <span className="pp-muted" style={{ marginLeft: 'auto' }}>{t('calibrationHint')}</span>
          </div>
          <div className="pp-stage" style={{ minHeight: 0, padding: 10 }}>
            <img src={items[index].previewUrl} alt={items[index].relPath} />
          </div>
          <div className="pp-actions">
            <button type="button" style={btn} disabled={busy} onClick={() => label('keep')}>{t('keep')}</button>
            <button type="button" style={btn} disabled={busy} onClick={() => label('maybe')}>{t('maybe')}</button>
            <button type="button" style={btn} disabled={busy} onClick={() => label('reject')}>{t('reject')}</button>
            <span style={{ flex: 1 }} />
            <button type="button" style={btn} disabled={busy} onClick={() => setPhase('idle')}>{t('close')}</button>
          </div>
        </div>
      )}

      {phase === 'report' && report !== null && summary(report)}
    </section>
  )
}

function SettingsDrawer({ t, detail, onClose, onSaved, onRunStage }: any) {
  const [form, setForm] = useState<any>(() => ({
    theme: detail.theme ?? 'mixed',
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
          theme: form.theme,
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.32)', zIndex: 80 }}>
      <div className="pp-drawer" onClick={event => event.stopPropagation()}>
        <div className="pp-modal-head">
          <span>{t('settingsTitle')}</span>
          <button type="button" style={btn} onClick={onClose}>{t('close')}</button>
        </div>

        <div className="pp-form">
          <div className="pp-section-title">{t('settingsBasic')}</div>
          <label className="pp-field">
            <span>{t('theme')}</span>
            <select value={form.theme} onChange={event => set('theme', event.target.value)} style={input}>
              <option value="mixed">{t('themeMixed')}</option>
              <option value="portrait">{t('themePortrait')}</option>
              <option value="landscape">{t('themeLandscape')}</option>
              <option value="event">{t('themeEvent')}</option>
            </select>
          </label>
          <label className="pp-field">
            <span>{t('model')}</span>
            <select value={form.modelId} onChange={event => set('modelId', event.target.value)} style={input}>
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
              <input value={form.concurrency} onChange={event => set('concurrency', event.target.value)} style={input} />
            </label>
            <label className="pp-field">
              <span>{t('budget')}</span>
              <input value={form.budgetCny} onChange={event => set('budgetCny', event.target.value)} style={input} />
            </label>
          </div>

          <div className="pp-section-title">{t('gridSize')} / {t('thresholds')}</div>
          <div className="pp-row">
            <label className="pp-field">
              <span>{t('gridCols')}</span>
              <input value={form.gridCols} onChange={event => set('gridCols', event.target.value)} style={input} />
            </label>
            <label className="pp-field">
              <span>{t('gridRows')}</span>
              <input value={form.gridRows} onChange={event => set('gridRows', event.target.value)} style={input} />
            </label>
          </div>
          <div className="pp-row">
            <label className="pp-field">
              <span>{t('thresholdKeep')}</span>
              <input value={form.thresholdKeep} onChange={event => set('thresholdKeep', event.target.value)} style={input} />
            </label>
            <label className="pp-field">
              <span>{t('thresholdMaybe')}</span>
              <input value={form.thresholdMaybe} onChange={event => set('thresholdMaybe', event.target.value)} style={input} />
            </label>
          </div>

          <div className="pp-section-title">{t('grouping')}</div>
          <div className="pp-row">
            <label className="pp-field">
              <span>{t('burstSeconds')}</span>
              <input value={form.groupBurstSeconds} onChange={event => set('groupBurstSeconds', event.target.value)} style={input} />
            </label>
            <label className="pp-field">
              <span>{t('burstHamming')}</span>
              <input value={form.groupBurstHamming} onChange={event => set('groupBurstHamming', event.target.value)} style={input} />
            </label>
          </div>
          <div className="pp-row">
            <label className="pp-field">
              <span>{t('sceneSeconds')}</span>
              <input value={form.groupSceneSeconds} onChange={event => set('groupSceneSeconds', event.target.value)} style={input} />
            </label>
            <label className="pp-field">
              <span>{t('sceneHamming')}</span>
              <input value={form.groupSceneHamming} onChange={event => set('groupSceneHamming', event.target.value)} style={input} />
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
              <button key={stage} type="button" style={btn} onClick={() => onRunStage?.(stage)}>
                {t('rerun')} {stageLabel(t, stage)}
              </button>
            ))}
          </div>

          <div className="pp-callout">{t('settingsHint')}</div>
          {error !== null && <div className="pp-error">{error}</div>}
          <div className="pp-modal-foot">
            <button type="button" style={btnPrimary} disabled={busy} onClick={save}>{t('save')}</button>
            {saved && <span className="pp-muted">{t('saved')}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectDetail({ t, id }: { t: (key: string) => string; id: string }) {
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
    return <div className="pp-card pp-panel"><span className="pp-muted">{t('loading')}</span></div>
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
    <div style={{ display: 'grid', gap: 16 }}>
      <section className="pp-card pp-summary">
        <div className="pp-summary-top">
          <strong className="pp-project-title">{detail.name}</strong>
          <span className="pp-pill">{statusLabel(t, detail.status)}</span>
          {runningLabel !== null && <span className="pp-pill" data-tone="live">{t('running')} · {runningLabel}</span>}
          <span className="pp-path" style={{ marginLeft: 'auto', maxWidth: '46%' }} title={detail.sourcePath}>
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

        <div className="pp-actions">
          <button type="button" style={btnPrimary} disabled={detail.running !== null} onClick={runAll}>
            {t('autoRun')}
          </button>
          {detail.running !== null && (
            <button type="button" style={btn} onClick={() => run(detail.running, 'pause')}>{t('pause')}</button>
          )}
          <div style={{ position: 'relative' }}>
            <button type="button" style={btn} onClick={() => setSingleStepsOpen(open => !open)}>
              {t('singleStep')} {singleStepsOpen ? '▴' : '▾'}
            </button>
            {singleStepsOpen && (
              <div className="pp-menu">
                {stages.map(stage => (
                  <button
                    key={stage}
                    type="button"
                    style={btn}
                    disabled={aiDisabled && ['grid', 'rank', 'score'].includes(stage)}
                    onClick={() => { setSingleStepsOpen(false); run(stage) }}
                  >
                    {stage === 'scan' ? t('scan') : stage === 'preprocess' ? t('preprocess') : stageLabel(t, stage)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span style={{ flex: 1 }} />
          <button type="button" style={btn} onClick={() => setExporting(true)}>{t('export')}</button>
          <button type="button" style={btn} onClick={() => setSettingsOpen(true)}>{t('settings')}</button>
        </div>

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
      </section>

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

      {error !== null && <div className="pp-error">{error}</div>}

      {checkpoints.length > 0 && (
        <details className="pp-card pp-history">
          <summary>
            <span>{t('history')}</span>
            <span className="pp-muted" style={{ marginLeft: 6 }}>
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
          <button
            type="button"
            style={{ ...btn, padding: '2px 8px', fontSize: 12 }}
            onClick={() => setNoticeDismissed(true)}
          >
            {t('close')}
          </button>
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
            {selected !== null && (
              <button type="button" style={btn} onClick={() => setSelected(null)}>{t('back')}</button>
            )}
            <button type="button" style={btnPrimary} onClick={() => { setCreating(true); setSelected(null) }}>
              {t('newProject')}
            </button>
          </div>
        </header>

        {error !== null && <div className="pp-error" style={{ marginBottom: 12 }}>{error}</div>}

        {selected !== null ? (
          <ProjectDetail t={t} id={selected} />
        ) : creating ? (
          <CreateForm
            t={t}
            onCreated={id => { setCreating(false); setSelected(id); void reload() }}
            onCancel={() => setCreating(false)}
          />
        ) : projects === null ? (
          <div className="pp-card pp-panel"><span className="pp-muted">{t('loading')}</span></div>
        ) : list.length === 0 ? (
          <div className="pp-empty">
            <div className="pp-empty-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 3.9 16.15 8.3l-1.55 5.25h-5.2L7.85 8.3 12 3.9Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </div>
            <h2>{t('empty')}</h2>
            <p>{t('subtitle')}</p>
            <button type="button" style={btnPrimary} onClick={() => setCreating(true)}>{t('newProject')}</button>
          </div>
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
                  {Object.entries(project.counts ?? {}).map(([state, n]) => (
                    <span className="pp-chip" key={state}>{stateLabel(t, state)} {String(n)}</span>
                  ))}
                  <span className="pp-chip">{t('spent')} ¥{Number(project.cost?.spentCny ?? 0).toFixed(4)}</span>
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
