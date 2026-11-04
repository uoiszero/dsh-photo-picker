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
  return status
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

function ProjectDetail({ t, id }: { t: (key: string) => string; id: string }) {
  const [detail, setDetail] = useState<any>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [progress, setProgress] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    try {
      setDetail(await api(`/photo-picker/api/projects/${id}`))
      setPhotos(await api(`/photo-picker/api/projects/${id}/photos?limit=120`))
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
      setProgress(event)
      if (event.done === true) refresh()
    }
    return () => events.close()
  }, [id])

  const run = async (stage: string) => {
    try {
      await api(`/photo-picker/api/projects/${id}/actions`, {
        method: 'POST',
        body: JSON.stringify({ stage }),
      })
    } catch (cause) {
      setError(String(cause))
    }
  }

  if (detail === null) return <div style={{ ...muted, fontSize: 13 }}>{t('loading')}</div>

  const counts = detail.counts ?? {}
  const version = detail.updatedAt ?? 0

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
          {detail.running !== null && (
            <span style={{ ...chip, color: 'var(--dsw-alias-brand-primary)' }}>{t('running')}: {detail.running}</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={btn} onClick={() => run('scan')}>{t('scan')}</button>
        <button type="button" style={btn} onClick={() => run('preprocess')}>{t('preprocess')}</button>
      </div>
      {progress !== null && (
        <div style={muted}>
          {progress.stage} {progress.done ?? 0}/{progress.total ?? '?'} {progress.error ?? ''}
        </div>
      )}
      {error !== null && <div style={{ color: 'var(--dsw-alias-state-danger-primary, #d0453a)', fontSize: 12 }}>{error}</div>}
      {photos.length === 0 ? (
        <div style={{ ...muted, fontSize: 13 }}>{t('noPhotos')}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 8 }}>
          {photos.map(photo => photo.hasThumb ? (
            <img
              key={photo.id}
              src={`${photo.thumbUrl}?v=${version}`}
              alt={photo.relPath}
              title={photo.relPath}
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, background: 'var(--dsw-alias-bg-layer-2)' }}
            />
          ) : (
            <div
              key={photo.id}
              title={photo.relPath}
              style={{
                aspectRatio: '1', borderRadius: 8, background: 'var(--dsw-alias-bg-layer-2)',
                border: '1px dashed var(--dsw-alias-border-l1)', display: 'grid', placeItems: 'center',
                padding: 6, fontSize: 11, color: 'var(--dsw-alias-label-tertiary)', textAlign: 'center', overflowWrap: 'anywhere',
              }}
            >
              {photo.state}
            </div>
          ))}
        </div>
      )}
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
