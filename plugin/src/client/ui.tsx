import React from 'react'

const h = React.createElement
const Fragment = React.Fragment

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'md' | 'sm'

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: React.ComponentProps<'button'> & { variant?: ButtonVariant; size?: ButtonSize }) {
  const classes = [
    'pp-button',
    variant !== 'secondary' ? `pp-button-${variant}` : '',
    size === 'sm' ? 'pp-button-sm' : '',
    className,
  ].filter(Boolean).join(' ')
  return <button type="button" className={classes} {...props} />
}

export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="pp-back" onClick={onClick}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10.5 3.5 6 8l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{label}</span>
    </button>
  )
}

export function CloseButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="pp-close" aria-label={label} title={label} onClick={onClick}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </button>
  )
}

export function Segmented({ label, items, value, onChange }: {
  label: string
  items: Array<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="pp-seg" role="group" aria-label={label}>
      {items.map(item => (
        <button
          key={item.value}
          type="button"
          className={value === item.value ? 'active' : ''}
          aria-pressed={value === item.value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function Tabs({ label, items, value, onChange }: {
  label: string
  items: Array<{ value: string; label: string; disabled?: boolean; title?: string }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="pp-tabs" role="tablist" aria-label={label}>
      {items.map(item => (
        <button
          key={item.value}
          type="button"
          role="tab"
          className="pp-tab"
          aria-selected={value === item.value}
          disabled={item.disabled === true}
          title={item.title}
          onClick={() => { if (item.disabled !== true) onChange(item.value) }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, help, children, className = '', as = 'label' }: {
  label: string
  help?: string
  children: React.ReactNode
  className?: string
  as?: 'label' | 'div'
}) {
  const Tag = as as any
  return (
    <Tag className={`pp-field ${className}`.trim()}>
      <span>{label}</span>
      {children}
      {help !== undefined && <span className="pp-field-help">{help}</span>}
    </Tag>
  )
}

export function Input(props: React.ComponentProps<'input'>) {
  return <input className="pp-input" {...props} />
}

export function Select(props: React.ComponentProps<'select'> & { compact?: boolean }) {
  const { compact = false, className = '', ...rest } = props
  return <select className={`pp-select${compact ? ' pp-select-sm' : ''} ${className}`.trim()} {...rest} />
}

export function StateCard({ kind, title, message, action }: {
  kind: 'loading' | 'error' | 'empty'
  title: string
  message?: string | null
  action?: React.ReactNode
}) {
  return (
    <div className={`pp-state pp-state-${kind}`} role={kind === 'error' ? 'alert' : undefined}>
      <span className="pp-state-icon" aria-hidden="true">
        {kind === 'loading' ? <span className="pp-spinner" /> : kind === 'error' ? '!' : '—'}
      </span>
      <span className="pp-state-copy">
        <strong>{title}</strong>
        {message !== undefined && message !== null && message !== '' && <span>{message}</span>}
      </span>
      {action}
    </div>
  )
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="pp-toolbar">{children}</div>
}

export function ToolbarGroup({ children, end = false }: { children: React.ReactNode; end?: boolean }) {
  return <div className={`pp-toolbar-group${end ? ' pp-toolbar-end' : ''}`}>{children}</div>
}

export function ActionBar({ children, end = false }: { children: React.ReactNode; end?: boolean }) {
  return <div className={`pp-actions${end ? ' pp-actions-right' : ''}`}>{children}</div>
}

export function Section({ title, actions, children }: {
  title?: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="pp-section">
      {(title !== undefined || actions !== undefined) && (
        <div className="pp-section-head">
          {title !== undefined && <h2>{title}</h2>}
          {actions !== undefined && <div className="pp-section-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
