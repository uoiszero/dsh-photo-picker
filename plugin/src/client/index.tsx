import React, { useEffect, useState, useSyncExternalStore } from 'react'

// esbuild 用 jsxFactory: 'h' 编译 JSX；Fragment 用于多根节点。
const h = React.createElement
const Fragment = React.Fragment

const NS = 'photoPicker'

const zh = {
  open: '照片工作台',
  title: '照片工作台',
  close: '关闭',
  newProject: '新建项目',
  folder: '照片文件夹',
  choose: '用系统对话框选择',
  browse: '浏览',
  up: '上一级',
  name: '项目名',
  theme: '题材',
  budget: '预算（元）',
  create: '创建项目',
  creating: '创建中…',
  projects: '项目',
  scan: '开始扫描',
  preprocess: '开始预处理',
  photos: '照片',
  running: '运行中',
  empty: '还没有项目，先选择照片文件夹。',
  error: '出错',
  loading: '加载中…',
}

const en = {
  open: 'Photo Picker',
  title: 'Photo Picker',
  close: 'Close',
  newProject: 'New project',
  folder: 'Photo folder',
  choose: 'Choose with system dialog',
  browse: 'Browse',
  up: 'Up',
  name: 'Project name',
  theme: 'Theme',
  budget: 'Budget (CNY)',
  create: 'Create project',
  creating: 'Creating…',
  projects: 'Projects',
  scan: 'Scan',
  preprocess: 'Preprocess',
  photos: 'Photos',
  running: 'Running',
  empty: 'No projects yet. Pick a photo folder first.',
  error: 'Error',
  loading: 'Loading…',
}

let open = false
const listeners = new Set<() => void>()
function setOpen(value: boolean) {
  open = value
  for (const listener of listeners) listener()
}
function useOpen() {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => open,
  )
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

function Launcher({ t }: { t: (key: string) => string }) {
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      style={{
        border: '1px solid #3a4050', borderRadius: 8, background: '#1a1f2a',
        color: '#e8eaf0', padding: '4px 10px', fontSize: 12, cursor: 'pointer',
      }}
    >
      {t('open')}
    </button>
  )
}

function CreateForm({ t, onCreated }: { t: (key: string) => string; onCreated: (id: string) => void }) {
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
    <div style={{ display: 'grid', gap: 10 }}>
      <label style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#9aa3b5' }}>{t('folder')}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={folder}
            onChange={event => setFolder(event.target.value)}
            placeholder="/Users/…/Pictures"
            style={{ flex: 1, background: '#11151d', border: '1px solid #3a4050', color: '#e8eaf0', borderRadius: 6, padding: '6px 8px' }}
          />
          <button type="button" onClick={choose}>{t('choose')}</button>
          <button type="button" onClick={() => browse(folder)}>{t('browse')}</button>
        </div>
      </label>
      {dirs.length > 0 && (
        <div style={{ maxHeight: 160, overflow: 'auto', border: '1px solid #2a2f3a', borderRadius: 6 }}>
          {dirs.map(dir => (
            <div
              key={dir.path}
              onClick={() => browse(dir.path)}
              style={{ padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}
            >
              {dir.name}
            </div>
          ))}
        </div>
      )}
      <label style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#9aa3b5' }}>{t('name')}</span>
        <input value={name} onChange={event => setName(event.target.value)} placeholder="2024 婚礼" style={{ background: '#11151d', border: '1px solid #3a4050', color: '#e8eaf0', borderRadius: 6, padding: '6px 8px' }} />
      </label>
      <div style={{ display: 'flex', gap: 10 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 12, color: '#9aa3b5' }}>{t('theme')}</span>
          <select value={theme} onChange={event => setTheme(event.target.value)}>
            <option value="mixed">混合</option>
            <option value="portrait">人像</option>
            <option value="landscape">风光</option>
            <option value="event">活动</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 12, color: '#9aa3b5' }}>{t('budget')}</span>
          <input value={budget} onChange={event => setBudget(event.target.value)} style={{ width: 80, background: '#11151d', border: '1px solid #3a4050', color: '#e8eaf0', borderRadius: 6, padding: '6px 8px' }} />
        </label>
      </div>
      <button type="button" disabled={busy || folder === ''} onClick={create}>
        {busy ? t('creating') : t('create')}
      </button>
      {error !== null && <div style={{ color: '#ff8a80', fontSize: 12 }}>{error}</div>}
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
      setPhotos(await api(`/photo-picker/api/projects/${id}/photos?limit=24`))
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

  if (detail === null) return <div style={{ fontSize: 12, color: '#9aa3b5' }}>{t('loading')}</div>

  const counts = detail.counts ?? {}
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <strong>{detail.name}</strong>
        <span style={{ fontSize: 12, color: '#9aa3b5' }}>{detail.sourcePath}</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9aa3b5' }}>{detail.status}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
        {Object.entries(counts).map(([state, count]) => (
          <span key={state} style={{ background: '#1a1f2a', borderRadius: 5, padding: '2px 8px' }}>
            {state}: {String(count)}
          </span>
        ))}
        {detail.running !== null && <span style={{ color: '#7ee2a8' }}>{t('running')}: {detail.running}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => run('scan')}>{t('scan')}</button>
        <button type="button" onClick={() => run('preprocess')}>{t('preprocess')}</button>
      </div>
      {progress !== null && (
        <div style={{ fontSize: 12, color: '#9aa3b5' }}>
          {progress.stage} {progress.done ?? 0}/{progress.total ?? '?'} {progress.error ?? ''}
        </div>
      )}
      {error !== null && <div style={{ color: '#ff8a80', fontSize: 12 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
        {photos.map(photo => (
          <img key={photo.id} src={`${photo.thumbUrl}?v=${detail.updatedAt ?? 0}`} alt={photo.relPath} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 4, background: '#1a1f2a' }} />
        ))}
      </div>
    </div>
  )
}

function Workbench({ t }: { t: (key: string) => string }) {
  const isOpen = useOpen()
  const [projects, setProjects] = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    api('/photo-picker/api/projects').then(setProjects).catch(cause => setError(String(cause)))
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,8,12,0.72)', zIndex: 9000, display: 'grid', placeItems: 'center', pointerEvents: 'auto' }}>
      <div style={{ width: 'min(980px, 92vw)', maxHeight: '88vh', overflow: 'auto', background: '#12161f', color: '#e8eaf0', border: '1px solid #2a2f3a', borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <strong style={{ fontSize: 16 }}>{t('title')}</strong>
          <button type="button" style={{ marginLeft: 'auto' }} onClick={() => setOpen(false)}>{t('close')}</button>
        </div>
        {error !== null && <div style={{ color: '#ff8a80', fontSize: 12, marginBottom: 10 }}>{error}</div>}
        {selected !== null ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <button type="button" onClick={() => setSelected(null)}>{t('projects')}</button>
            <ProjectDetail t={t} id={selected} />
          </div>
        ) : creating ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <button type="button" onClick={() => setCreating(false)}>{t('projects')}</button>
            <CreateForm t={t} onCreated={id => { setCreating(false); setSelected(id); api('/photo-picker/api/projects').then(setProjects).catch(() => {}) }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            <button type="button" onClick={() => setCreating(true)}>{t('newProject')}</button>
            {projects.length === 0 ? (
              <div style={{ fontSize: 12, color: '#9aa3b5' }}>{t('empty')}</div>
            ) : projects.map(project => (
              <button type="button" key={project.id} onClick={() => setSelected(project.id)} style={{ textAlign: 'left', padding: 10 }}>
                {project.name} · {project.sourcePath}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Panel({ t }: { t: (key: string) => string }) {
  return <Workbench t={t} />
}

export const inject = ['slots', 'locale']

export function apply(ctx: any) {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'photo-picker.locale')
  ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register(
    { name: 'conversation.composer.dock', id: 'photo-picker-launcher', order: 60 },
    () => <Launcher t={t} />,
  ))
  ctx.slots.inject('shell.overlay', () => ctx.slots.register(
    { name: 'shell.overlay', id: 'photo-picker-panel', order: 60 },
    () => <Panel t={t} />,
  ))
}
