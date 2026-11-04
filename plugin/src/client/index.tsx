import React, { useEffect, useState } from 'react'

// esbuild 用 jsxFactory: 'h' 编译 JSX；Fragment 用于多根节点。
const h = React.createElement
const Fragment = React.Fragment

const NS = 'photoPicker'
const PANEL_ID = 'photo-picker'

const zh = {
  title: '照片工作台',
  subtitle: '选择本机照片文件夹，扫描并做本地预处理（去重 / 技术过滤 / 分组）。',
  newProject: '新建项目',
  folder: '照片文件夹',
  choose: '用系统对话框选择',
  browse: '浏览',
  name: '项目名',
  theme: '题材',
  budget: '预算（元）',
  create: '创建项目',
  creating: '创建中…',
  projectList: '项目',
  projects: '项目',
  back: '返回项目列表',
  scan: '开始扫描',
  preprocess: '开始预处理',
  running: '运行中',
  empty: '还没有项目。先选择照片文件夹，建一个项目。',
  noPhotos: '还没有缩略图。先「开始扫描」，再「开始预处理」。',
  loading: '加载中…',
  themeMixed: '混合',
  themePortrait: '人像',
  themeLandscape: '风光',
  themeEvent: '活动',
  statusCreated: '新建',
  statusScanned: '已扫描',
  statusPreprocessed: '已预处理',
  statusGridded: '已粗筛',
  statusScored: '已评分',
  statusPaused: '已暂停',
  statusFailed: '失败',
  stageScan: '扫描',
  stagePreprocess: '预处理',
  stageGrid: '网格粗筛',
  stageRank: '组内排序',
  stageScore: '单张精评',
  pause: '暂停',
  spent: '已花费',
  checkpoint: '检查点',
  aiDisabled: '当前模型不支持图片输入，AI 阶段已禁用。',
  review: '复核',
  filterAll: '全部',
  filterKeep: 'keep',
  filterMaybe: 'maybe',
  filterReject: 'reject',
  sortScore: '按分数',
  sortTaken: '按拍摄时间',
  sortPath: '按路径',
  selectedCount: '已选',
  undoAction: '撤销',
  export: '导出',
  exportTitle: '导出照片',
  exportDest: '目标目录',
  exportChoose: '选择目录',
  exportBuckets: '分桶',
  exportMode: '方式',
  exportHardlink: '硬链接',
  exportCopy: '复制',
  exportPreview: '预览汇总',
  exportRun: '执行导出',
  exportResult: '已导出',
  exportConflict: '冲突',
  exportSkipped: '已存在',
  exportSameVolume: '同盘，可用硬链接',
  exportCrossVolume: '跨盘，将回退复制',
  manifest: 'manifest',
  dimensionComposition: '构图',
  dimensionLight: '光影',
  dimensionColor: '色彩',
  dimensionTechnique: '技术',
  dimensionPostPotential: '后期潜力',
  dimensionMoment: '瞬间',
  postProcessing: '后期建议',
  reason: '理由',
  scoreLabel: '分数',
  backToWall: '返回图墙',
  keep: '保留 (P)',
  maybe: '待定 (M)',
  reject: '弃用 (X)',
  keyboardHint: 'J/K 前后 · P 保留 · M 待定 · X 弃用 · Space 返回',
  groupCompare: '组对比 (G)',
  groupKindBurst: '连拍',
  groupKindScene: '同场景',
  groupConfirm: '确认本组 (Enter)',
  groupRejectAll: '全组弃用 (X)',
  groupHint: '1–6 选一张 · Enter 确认本组（选中 keep，其余 reject） · ←/→ 换组 · Space 返回',
  calibration: '校准',
  calibrationStart: '开始校准',
  calibrationProgress: '第 {n} / {total} 张',
  calibrationHint: '盲评：只凭肉眼判断，不看 AI 分数。完成后揭示一致率与建议阈值。',
  calibrationPrecision: 'keep 精确率',
  calibrationRecall: 'keep 召回率',
  calibrationF1: 'keep F1',
  calibrationAgreement: '一致率',
  calibrationSuggested: '建议阈值',
  calibrationApply: '应用建议阈值',
  calibrationApplied: '已应用到项目',
  calibrationNoSample: '还没有已评分的照片，先跑一次单张精评再校准。',
  calibrationLast: '上次校准',
}

const en = {
  title: 'Photo Picker',
  subtitle: 'Pick a local photo folder, scan it, then run local preprocess (dedupe / technical filters / grouping).',
  newProject: 'New project',
  folder: 'Photo folder',
  choose: 'Choose with system dialog',
  browse: 'Browse',
  name: 'Project name',
  theme: 'Theme',
  budget: 'Budget (CNY)',
  create: 'Create project',
  creating: 'Creating…',
  projectList: 'Projects',
  projects: 'Projects',
  back: 'Back to projects',
  scan: 'Scan',
  preprocess: 'Preprocess',
  running: 'Running',
  empty: 'No projects yet. Pick a photo folder to create one.',
  noPhotos: 'No thumbnails yet. Run Scan, then Preprocess.',
  loading: 'Loading…',
  themeMixed: 'Mixed',
  themePortrait: 'Portrait',
  themeLandscape: 'Landscape',
  themeEvent: 'Event',
  statusCreated: 'New',
  statusScanned: 'Scanned',
  statusPreprocessed: 'Preprocessed',
  statusGridded: 'Gridded',
  statusScored: 'Scored',
  statusPaused: 'Paused',
  statusFailed: 'Failed',
  stageScan: 'Scan',
  stagePreprocess: 'Preprocess',
  stageGrid: 'Grid triage',
  stageRank: 'Rank group',
  stageScore: 'Score photo',
  pause: 'Pause',
  spent: 'Spent',
  checkpoint: 'Checkpoints',
  aiDisabled: 'The current model does not accept image input, so AI stages are disabled.',
  review: 'Review',
  filterAll: 'All',
  filterKeep: 'keep',
  filterMaybe: 'maybe',
  filterReject: 'reject',
  sortScore: 'By score',
  sortTaken: 'By time',
  sortPath: 'By path',
  selectedCount: 'Selected',
  undoAction: 'Undo',
  export: 'Export',
  exportTitle: 'Export photos',
  exportDest: 'Destination',
  exportChoose: 'Choose folder',
  exportBuckets: 'Buckets',
  exportMode: 'Mode',
  exportHardlink: 'Hardlink',
  exportCopy: 'Copy',
  exportPreview: 'Preview',
  exportRun: 'Export',
  exportResult: 'Exported',
  exportConflict: 'Conflicts',
  exportSkipped: 'Existing',
  exportSameVolume: 'Same volume, hardlinks available',
  exportCrossVolume: 'Cross volume, will fall back to copy',
  manifest: 'manifest',
  dimensionComposition: 'Composition',
  dimensionLight: 'Light',
  dimensionColor: 'Color',
  dimensionTechnique: 'Technique',
  dimensionPostPotential: 'Post',
  dimensionMoment: 'Moment',
  postProcessing: 'Suggestions',
  reason: 'Reason',
  scoreLabel: 'Score',
  backToWall: 'Back to wall',
  keep: 'Keep (P)',
  maybe: 'Maybe (M)',
  reject: 'Reject (X)',
  keyboardHint: 'J/K prev/next · P keep · M maybe · X reject · Space back',
  groupCompare: 'Compare group (G)',
  groupKindBurst: 'Burst',
  groupKindScene: 'Scene',
  groupConfirm: 'Confirm group (Enter)',
  groupRejectAll: 'Reject group (X)',
  groupHint: '1–6 pick one · Enter confirm (chosen keep, rest reject) · ←/→ switch group · Space back',
  calibration: 'Calibration',
  calibrationStart: 'Start calibration',
  calibrationProgress: '{n} / {total}',
  calibrationHint: 'Blind review: judge by eye only, AI scores stay hidden. Finish to reveal agreement and a suggested threshold.',
  calibrationPrecision: 'Keep precision',
  calibrationRecall: 'Keep recall',
  calibrationF1: 'Keep F1',
  calibrationAgreement: 'Agreement',
  calibrationSuggested: 'Suggested threshold',
  calibrationApply: 'Apply suggested threshold',
  calibrationApplied: 'Applied to project',
  calibrationNoSample: 'No scored photos yet. Run single-photo scoring first.',
  calibrationLast: 'Previous calibration',
}

const btn = {
  background: 'var(--dsw-alias-bg-layer-1)',
  color: 'var(--dsw-alias-label-primary)',
  border: '1px solid var(--dsw-alias-border-l1)',
  borderRadius: 8,
  padding: '6px 12px',
  fontSize: 13,
  lineHeight: 1.4,
  cursor: 'pointer',
}

const btnPrimary = {
  ...btn,
  background: 'var(--dsw-alias-button-primary-fill)',
  color: 'var(--dsw-alias-label-primary-foreground)',
  border: '1px solid transparent',
}

const input = {
  background: 'var(--dsw-alias-bg-layer-1)',
  color: 'var(--dsw-alias-label-primary)',
  border: '1px solid var(--dsw-alias-border-l1)',
  borderRadius: 8,
  padding: '7px 10px',
  fontSize: 13,
  minWidth: 0,
}

const muted = { color: 'var(--dsw-alias-label-secondary)', fontSize: 12 }

const chip = {
  background: 'var(--dsw-alias-bg-layer-2)',
  borderRadius: 6,
  padding: '2px 8px',
  fontSize: 12,
  color: 'var(--dsw-alias-label-secondary)',
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

function summarizeStats(stats: any) {
  if (stats === null || stats === undefined) return ''
  const parts: string[] = []
  for (const key of ['photos', 'selected', 'rejected', 'failed', 'groups', 'kept', 'scored', 'done', 'errors']) {
    if (typeof stats[key] === 'number') parts.push(`${key} ${stats[key]}`)
  }
  if (typeof stats.durationMs === 'number') parts.push(`${Math.round(stats.durationMs / 1000)}s`)
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
    try {
      const result = await api('/photo-picker/api/fs/choose', { method: 'POST' })
      setFolder(result.path)
      setError(null)
    } catch (cause) {
      setError(String(cause))
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
    <div style={{ display: 'grid', gap: 14, maxWidth: 640, border: '1px solid var(--dsw-alias-border-l1)', background: 'var(--dsw-alias-bg-layer-1)', borderRadius: 12, padding: 16 }}>
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={muted}>{t('folder')}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={folder}
            onChange={event => setFolder(event.target.value)}
            placeholder="/Users/…/Pictures"
            style={{ ...input, flex: 1 }}
          />
          <button type="button" style={btn} onClick={choose}>{t('choose')}</button>
          <button type="button" style={btn} onClick={() => browse(folder)}>{t('browse')}</button>
        </div>
      </label>
      {dirs.length > 0 && (
        <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid var(--dsw-alias-border-l1)', borderRadius: 8 }}>
          {dirs.map(dir => (
            <div
              key={dir.path}
              onClick={() => browse(dir.path)}
              style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}
            >
              {dir.name}
            </div>
          ))}
        </div>
      )}
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={muted}>{t('name')}</span>
        <input value={name} onChange={event => setName(event.target.value)} placeholder="2024 婚礼" style={input} />
      </label>
      <div style={{ display: 'flex', gap: 14 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={muted}>{t('theme')}</span>
          <select value={theme} onChange={event => setTheme(event.target.value)} style={input}>
            <option value="mixed">{t('themeMixed')}</option>
            <option value="portrait">{t('themePortrait')}</option>
            <option value="landscape">{t('themeLandscape')}</option>
            <option value="event">{t('themeEvent')}</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={muted}>{t('budget')}</span>
          <input value={budget} onChange={event => setBudget(event.target.value)} style={{ ...input, width: 100 }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={btnPrimary} disabled={busy || folder === ''} onClick={create}>
          {busy ? t('creating') : t('create')}
        </button>
        <button type="button" style={btn} onClick={onCancel}>{t('back')}</button>
      </div>
      {error !== null && <div style={{ color: 'var(--dsw-alias-state-danger-primary, #d0453a)', fontSize: 12 }}>{error}</div>}
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
    for (const [photoId, verdict] of Object.entries(entry.previous)) {
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
    ['keep', t('filterKeep')],
    ['maybe', t('filterMaybe')],
    ['reject', t('filterReject')],
  ]

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ ...muted, fontWeight: 600 }}>{t('review')}</span>
        {filters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            style={{
              ...chip,
              cursor: 'pointer',
              border: '1px solid transparent',
              background: filter === value ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-bg-layer-2)',
              color: filter === value ? 'var(--dsw-alias-label-primary-foreground)' : 'var(--dsw-alias-label-secondary)',
            }}
          >
            {label}
          </button>
        ))}
        <select value={sort} onChange={event => setSort(event.target.value)} style={{ ...input, padding: '4px 8px', fontSize: 12 }}>
          <option value="score">{t('sortScore')}</option>
          <option value="taken_at">{t('sortTaken')}</option>
          <option value="rel_path">{t('sortPath')}</option>
        </select>
        <span style={{ ...muted, marginLeft: 'auto' }}>{items.length} / {t('photos')}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={muted}>{t('selectedCount')}: {selected.length}</span>
        <button type="button" style={btn} disabled={selected.length === 0} onClick={() => decide(selected, 'keep')}>{t('keep')}</button>
        <button type="button" style={btn} disabled={selected.length === 0} onClick={() => decide(selected, 'maybe')}>{t('maybe')}</button>
        <button type="button" style={btn} disabled={selected.length === 0} onClick={() => decide(selected, 'reject')}>{t('reject')}</button>
        <button type="button" style={btn} disabled={undo.length === 0} onClick={undoLast}>{t('undoAction')}</button>
      </div>

      {error !== null && <div style={{ color: 'var(--dsw-alias-state-danger-primary, #d0453a)', fontSize: 12 }}>{error}</div>}

      {items.length === 0 ? (
        <div style={{ ...muted, fontSize: 13 }}>{t('noPhotos')}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: 8 }}>
          {items.map(item => (
            <div key={item.id} style={{ position: 'relative' }}>
              <button
                type="button"
                title={item.relPath}
                onClick={() => setSingle(item.id)}
                style={{
                  display: 'block', width: '100%', aspectRatio: '1', padding: 0,
                  border: '1px solid var(--dsw-alias-border-l1)', borderRadius: 8, overflow: 'hidden',
                  background: 'var(--dsw-alias-bg-layer-2)', cursor: 'pointer', position: 'relative',
                }}
              >
                <img src={`${item.thumbUrl}?v=${version}`} alt={item.relPath} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: VERDICT_COLORS[item.verdict] ?? 'var(--dsw-alias-border-l2)' }} />
                {item.score !== null && (
                  <span style={{ position: 'absolute', top: 6, left: 6, padding: '1px 6px', borderRadius: 6, background: 'rgba(0,0,0,0.62)', color: '#fff', fontSize: 11 }}>
                    {Number(item.score).toFixed(1)}
                  </span>
                )}
                {item.humanVerdict !== null && (
                  <span style={{ position: 'absolute', bottom: 8, right: 6, padding: '1px 5px', borderRadius: 5, background: 'rgba(0,0,0,0.62)', color: '#fff', fontSize: 10 }}>
                    {item.humanVerdict}
                  </span>
                )}
              </button>
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => toggle(item.id)}
                style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, cursor: 'pointer' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PhotoSingle({ t, projectId, items, photoId, version, onNavigate, onOpenGroup, onDecide, onClose }: any) {
  const [detail, setDetail] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDetail(null)
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
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={btn} onClick={onClose}>{t('backToWall')}</button>
        {detail.group !== undefined && (
          <button type="button" style={btn} onClick={() => onOpenGroup(detail.group.id)}>{t('groupCompare')}</button>
        )}
        <span style={muted}>{index + 1} / {items.length}</span>
        <span style={{ ...chip, background: VERDICT_COLORS[detail.verdict] ?? 'var(--dsw-alias-bg-layer-2)', color: '#fff' }}>{detail.verdict}</span>
        {detail.score !== null && <span style={chip}>{t('scoreLabel')}: {detail.score}</span>}
        <span style={{ ...muted, marginLeft: 'auto' }}>{detail.relPath}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 14, alignItems: 'start' }}>
        <img
          src={`${detail.previewUrl}?v=${version}`}
          alt={detail.relPath}
          style={{ width: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 10, background: 'var(--dsw-alias-bg-layer-2)' }}
        />
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" style={btn} onClick={() => onDecide([photoId], 'keep')}>{t('keep')}</button>
            <button type="button" style={btn} onClick={() => onDecide([photoId], 'maybe')}>{t('maybe')}</button>
            <button type="button" style={btn} onClick={() => onDecide([photoId], 'reject')}>{t('reject')}</button>
          </div>
          <div style={{ ...muted, fontSize: 12 }}>{t('keyboardHint')}</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {Object.keys(DIMENSION_LABELS).map(key => {
              const value = dimensions[key]
              return (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '64px 1fr 28px', gap: 8, alignItems: 'center', fontSize: 12 }}>
                  <span style={muted}>{t(DIMENSION_LABELS[key])}</span>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--dsw-alias-bg-layer-2)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(0, Math.min(10, value ?? 0)) * 10}%`, background: 'var(--dsw-alias-brand-primary)' }} />
                  </div>
                  <span>{value === null || value === undefined ? '—' : value}</span>
                </div>
              )
            })}
          </div>
          {detail.reason !== null && (
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ ...muted, fontWeight: 600 }}>{t('reason')}</span>
              <span style={{ fontSize: 13 }}>{detail.reason}</span>
            </div>
          )}
          {(detail.postProcessing ?? []).length > 0 && (
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ ...muted, fontWeight: 600 }}>{t('postProcessing')}</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {detail.postProcessing.map((code: string) => <span key={code} style={chip}>{code}</span>)}
              </div>
            </div>
          )}
          <div style={muted}>
            {detail.width} × {detail.height}
            {detail.group !== undefined ? ` · 组内第 ${detail.group.rank}/${detail.group.size}` : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

function ExportDialog({ t, projectId, onClose }: { t: (key: string) => string; projectId: string; onClose: () => void }) {
  const [dest, setDest] = useState('')
  const [buckets, setBuckets] = useState(['keep', 'maybe'])
  const [mode, setMode] = useState('hardlink')
  const [preview, setPreview] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleBucket = (bucket: string) => setBuckets(current => (
    current.includes(bucket) ? current.filter(item => item !== bucket) : [...current, bucket]
  ))

  const choose = async () => {
    try {
      const picked = await api('/photo-picker/api/fs/choose', { method: 'POST' })
      setDest(picked.path)
    } catch (cause) {
      setError(String(cause))
    }
  }

  const execute = async (action: 'preview' | 'run') => {
    setBusy(true)
    setError(null)
    try {
      const data = await api(`/photo-picker/api/projects/${projectId}/export/${action}`, {
        method: 'POST',
        body: JSON.stringify({ dest, buckets, mode }),
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', zIndex: 70, display: 'grid', placeItems: 'center' }}>
      <div style={{
        width: 'min(620px, 92vw)', maxHeight: '86vh', overflow: 'auto',
        background: 'var(--dsw-alias-bg-overlay)', color: 'var(--dsw-alias-label-primary)',
        border: '1px solid var(--dsw-alias-border-l1)', borderRadius: 14, padding: 18, display: 'grid', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <strong>{t('exportTitle')}</strong>
          <button type="button" style={{ ...btn, marginLeft: 'auto' }} onClick={onClose}>{t('close')}</button>
        </div>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={muted}>{t('exportDest')}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={dest}
              onChange={event => setDest(event.target.value)}
              placeholder="/Volumes/…/精选"
              style={{ ...input, flex: 1 }}
            />
            <button type="button" style={btn} onClick={choose}>{t('exportChoose')}</button>
          </div>
        </label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={muted}>{t('exportBuckets')}</span>
          {['keep', 'maybe', 'reject'].map(bucket => (
            <label key={bucket} style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 13 }}>
              <input type="checkbox" checked={buckets.includes(bucket)} onChange={() => toggleBucket(bucket)} />
              {bucket}
            </label>
          ))}
          <span style={{ ...muted, marginLeft: 8 }}>{t('exportMode')}</span>
          <select value={mode} onChange={event => setMode(event.target.value)} style={{ ...input, padding: '4px 8px', fontSize: 12 }}>
            <option value="hardlink">{t('exportHardlink')}</option>
            <option value="copy">{t('exportCopy')}</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={btn} disabled={busy || dest === ''} onClick={() => execute('preview')}>{t('exportPreview')}</button>
          <button type="button" style={btnPrimary} disabled={busy || dest === '' || preview === null} onClick={() => execute('run')}>{t('exportRun')}</button>
        </div>
        {error !== null && <div style={{ color: 'var(--dsw-alias-state-danger-primary, #d0453a)', fontSize: 12 }}>{error}</div>}
        {preview !== null && (
          <div style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            <span>{Object.entries(preview.counts).map(([bucket, count]) => `${bucket} ${count}`).join(' · ')} · {(preview.totalBytes / 1024 / 1024).toFixed(1)} MB</span>
            <span style={muted}>
              {t('exportSkipped')} {preview.skippedExisting} · {t('exportConflict')} {preview.conflictCount} · {preview.sameVolume ? t('exportSameVolume') : t('exportCrossVolume')}
            </span>
          </div>
        )}
        {result !== null && (
          <div style={{ display: 'grid', gap: 4, fontSize: 13 }}>
            <span>{t('exportResult')}: {Object.entries(result.counts).map(([bucket, count]) => `${bucket} ${count}`).join(' · ')}</span>
            <span style={muted}>{t('manifest')}: {result.manifestPath}</span>
            {result.failureCount > 0 && (
              <span style={{ color: 'var(--dsw-alias-state-danger-primary, #d0453a)' }}>{t('exportConflict')}: {result.failureCount}</span>
            )}
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
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" style={btn} onClick={onClose}>{t('backToWall')}</button>
        <span style={chip}>{kindLabel}</span>
        <span style={chip}>{detail.size} {t('photos')}</span>
        {pageCount > 1 && (
          <span style={chip}>{page + 1} / {pageCount}</span>
        )}
        <span style={muted}>{index >= 0 ? `${index + 1} / ${groups.length}` : ''}</span>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        {visible.map((member: any, localPosition: number) => {
          const position = pageStart + localPosition
          return (
          <button
            key={member.id}
            type="button"
            onClick={() => setSelected(position)}
            style={{
              padding: 0, overflow: 'hidden', borderRadius: 10, cursor: 'pointer', position: 'relative',
              border: position === selected ? '2px solid var(--dsw-alias-brand-primary)' : '1px solid var(--dsw-alias-border-l1)',
              background: 'var(--dsw-alias-bg-layer-2)',
            }}
          >
            <img
              src={`${member.thumbUrl}?v=${version}`}
              alt={member.relPath}
              style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block' }}
            />
            <span style={{ position: 'absolute', top: 6, left: 6, padding: '1px 6px', borderRadius: 6, background: 'rgba(0,0,0,0.62)', color: '#fff', fontSize: 11 }}>
              #{position + 1}{member.score !== null && member.score !== undefined ? ` · ${Number(member.score).toFixed(1)}` : ''}
            </span>
            {member.humanVerdict !== null && (
              <span style={{ position: 'absolute', bottom: 6, right: 6, padding: '1px 6px', borderRadius: 6, background: 'rgba(0,0,0,0.62)', color: '#fff', fontSize: 10 }}>
                {member.humanVerdict}
              </span>
            )}
          </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={btnPrimary} disabled={busy} onClick={confirm}>{t('groupConfirm')}</button>
        <button type="button" style={btn} disabled={busy} onClick={() => decide('reject', detail.members.map((member: any) => member.id))}>
          {t('groupRejectAll')}
        </button>
      </div>
      <div style={{ ...muted, fontSize: 12 }}>{t('groupHint')}</div>
    </div>
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

  const submit = async allLabels => {
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
    <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span>{t('calibrationPrecision')}: {(data.keep?.precision ?? 0).toFixed(2)}</span>
        <span>{t('calibrationRecall')}: {(data.keep?.recall ?? 0).toFixed(2)}</span>
        <span>{t('calibrationF1')}: {(data.keep?.f1 ?? 0).toFixed(2)}</span>
        <span>{t('calibrationAgreement')}: {((data.agreement ?? 0) * 100).toFixed(0)}%</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={chip}>{t('calibrationSuggested')}: keep ≥ {data.suggestedKeep} · maybe ≥ {data.suggestedMaybe}</span>
        <button type="button" style={btn} disabled={busy} onClick={apply}>
          {applied ? t('calibrationApplied') : t('calibrationApply')}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ ...muted, fontWeight: 600 }}>{t('calibration')}</span>
        <button type="button" style={btn} disabled={busy} onClick={start}>{t('calibrationStart')}</button>
        {phase === 'idle' && latest?.metrics !== null && latest?.metrics !== undefined && (
          <span style={{ ...muted, marginLeft: 'auto' }}>{t('calibrationLast')}: {latest.sampleSize} {t('photos')}</span>
        )}
      </div>

      {error !== null && <div style={{ color: 'var(--dsw-alias-state-danger-primary, #d0453a)', fontSize: 12 }}>{error}</div>}

      {phase === 'idle' && latest?.metrics !== null && latest?.metrics !== undefined && summary(latest.metrics)}

      {phase === 'blind' && items[index] !== undefined && (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={chip}>{t('calibrationProgress').replace('{n}', String(index + 1)).replace('{total}', String(items.length))}</span>
            <span style={{ ...muted, marginLeft: 'auto' }}>{t('calibrationHint')}</span>
          </div>
          <img
            src={items[index].previewUrl}
            alt={items[index].relPath}
            style={{ width: '100%', maxHeight: '62vh', objectFit: 'contain', borderRadius: 10, background: 'var(--dsw-alias-bg-layer-2)' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={btn} disabled={busy} onClick={() => label('keep')}>{t('keep')}</button>
            <button type="button" style={btn} disabled={busy} onClick={() => label('maybe')}>{t('maybe')}</button>
            <button type="button" style={btn} disabled={busy} onClick={() => label('reject')}>{t('reject')}</button>
            <button type="button" style={btn} disabled={busy} onClick={() => setPhase('idle')}>{t('close')}</button>
          </div>
        </div>
      )}

      {phase === 'report' && report !== null && summary(report)}
    </div>
  )
}

function ProjectDetail({ t, id }: { t: (key: string) => string; id: string }) {
  const [detail, setDetail] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)
  const [checkpoints, setCheckpoints] = useState<any[]>([])
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    try {
      const [project, points] = await Promise.all([
        api(`/photo-picker/api/projects/${id}`),
        api(`/photo-picker/api/projects/${id}/checkpoints`),
      ])
      setDetail(project)
      setCheckpoints(points)
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
      if (event.stage !== undefined) setProgress(event)
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

  if (detail === null) return <div style={{ ...muted, fontSize: 13 }}>{t('loading')}</div>

  const counts = detail.counts ?? {}
  const version = detail.updatedAt ?? 0
  const aiDisabled = detail.ai?.hasImageModel === false
  const percent = progress?.total ? Math.min(100, Math.round((progress.done ?? 0) / progress.total * 100)) : 0

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 16 }}>{detail.name}</strong>
          <span style={chip}>{statusLabel(t, detail.status)}</span>
          <span style={muted}>{detail.sourcePath}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Object.entries(counts).map(([state, count]) => (
            <span key={state} style={chip}>{state}: {String(count)}</span>
          ))}
          <span style={chip}>
            {t('spent')}: ¥{Number(detail.cost?.spentCny ?? 0).toFixed(4)} / ¥{Number(detail.cost?.budgetCny ?? 0).toFixed(0)}
          </span>
          {detail.running !== null && (
            <span style={{ ...chip, color: 'var(--dsw-alias-brand-primary)' }}>{t('running')}: {detail.running}</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={btn} onClick={() => run('scan')}>{t('scan')}</button>
        <button type="button" style={btn} onClick={() => run('preprocess')}>{t('preprocess')}</button>
        <button type="button" style={btn} disabled={aiDisabled} onClick={() => run('grid')}>{t('stageGrid')}</button>
        <button type="button" style={btn} disabled={aiDisabled} onClick={() => run('rank')}>{t('stageRank')}</button>
        <button type="button" style={btn} disabled={aiDisabled} onClick={() => run('score')}>{t('stageScore')}</button>
        {detail.running !== null && (
          <button type="button" style={btn} onClick={() => run(detail.running, 'pause')}>{t('pause')}</button>
        )}
        <button type="button" style={btn} onClick={() => setExporting(true)}>{t('export')}</button>
      </div>
      {exporting && <ExportDialog t={t} projectId={id} onClose={() => setExporting(false)} />}
      {aiDisabled && <div style={muted}>{t('aiDisabled')}</div>}
      {progress !== null && (
        <div style={{ display: 'grid', gap: 4 }}>
          <div style={muted}>
            {stageLabel(t, progress.stage)} {progress.done ?? 0}/{progress.total ?? '?'}
            {progress.costCny !== undefined ? ` · ¥${Number(progress.costCny).toFixed(4)}` : ''}
            {progress.error !== undefined && progress.error !== null ? ` · ${String(progress.error)}` : ''}
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--dsw-alias-bg-layer-2)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percent}%`, background: 'var(--dsw-alias-brand-primary)' }} />
          </div>
        </div>
      )}
      {error !== null && <div style={{ color: 'var(--dsw-alias-state-danger-primary, #d0453a)', fontSize: 12 }}>{error}</div>}
      {checkpoints.length > 0 && (
        <div style={{ display: 'grid', gap: 8 }}>
          <span style={{ ...muted, fontWeight: 600 }}>{t('checkpoint')}</span>
          {checkpoints.map(cp => (
            <div key={cp.stage} style={{
              border: '1px solid var(--dsw-alias-border-l1)', borderRadius: 10,
              padding: 12, display: 'grid', gap: 8,
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <strong>{stageLabel(t, cp.stage)}</strong>
                <span style={chip}>{cp.status}</span>
                <span style={chip}>¥{Number(cp.costCny ?? 0).toFixed(4)}</span>
                <span style={{ ...muted, marginLeft: 'auto' }}>{summarizeStats(cp.stats)}</span>
              </div>
              {(cp.sampleIds ?? []).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
                  {cp.sampleIds.map((pid: string) => (
                    <img
                      key={pid}
                      src={`/photo-picker/media/thumb/${id}/${pid}?v=${version}`}
                      alt={pid}
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6, background: 'var(--dsw-alias-bg-layer-2)' }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <ReviewSection t={t} projectId={id} version={version} onChanged={refresh} />
      <CalibrationSection t={t} projectId={id} onApplied={refresh} />
    </div>
  )
}

function Workbench({ t }: { t: (key: string) => string }) {
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
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: 'var(--dsw-alias-bg-base)', color: 'var(--dsw-alias-label-primary)',
      fontSize: 14, lineHeight: 1.6,
    }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 clamp(24px, 4vw, 48px) 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 28, marginBottom: 24 }}>
          <div style={{ display: 'grid', gap: 2 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{t('title')}</h1>
            <span style={muted}>{t('subtitle')}</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {selected !== null && (
              <button type="button" style={btn} onClick={() => setSelected(null)}>{t('back')}</button>
            )}
            <button type="button" style={selected !== null ? btn : btnPrimary} onClick={() => { setCreating(true); setSelected(null) }}>
              {t('newProject')}
            </button>
          </div>
        </div>

        {error !== null && (
          <div style={{ color: 'var(--dsw-alias-state-danger-primary, #d0453a)', fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}

        {selected !== null ? (
          <ProjectDetail t={t} id={selected} />
        ) : creating ? (
          <CreateForm
            t={t}
            onCreated={id => { setCreating(false); setSelected(id); void reload() }}
            onCancel={() => setCreating(false)}
          />
        ) : projects === null ? (
          <div style={{ ...muted, fontSize: 13 }}>{t('loading')}</div>
        ) : list.length === 0 ? (
          <div style={{
            display: 'grid', gap: 12, placeItems: 'start', border: '1px dashed var(--dsw-alias-border-l2)',
            borderRadius: 12, padding: 24, color: 'var(--dsw-alias-label-secondary)', fontSize: 13,
          }}>
            <span>{t('empty')}</span>
            <button type="button" style={btnPrimary} onClick={() => setCreating(true)}>{t('newProject')}</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {list.map(project => (
              <button
                type="button"
                key={project.id}
                onClick={() => setSelected(project.id)}
                style={{
                  ...btn, textAlign: 'left', display: 'grid', gap: 4, padding: '12px 14px', borderRadius: 10,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 14 }}>{project.name}</strong>
                  <span style={chip}>{statusLabel(t, project.status)}</span>
                </span>
                <span style={muted}>
                  {project.sourcePath}
                  {' · '}
                  {Object.entries(project.counts ?? {}).map(([state, n]) => `${state} ${String(n)}`).join('  ')}
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
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'photo-picker.locale')
  ctx.slots.inject('main', () => ctx.slots.register(
    { name: 'main', key: PANEL_ID, locale: NS },
    Workbench,
  ))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
    { name: 'sidebar.panellist', id: PANEL_ID, order: 20, locale: NS, label: () => t('title') },
    PhotoPickerIcon,
  ))
}
