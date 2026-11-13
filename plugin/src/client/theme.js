/** 工作台界面样式：注入一次，全部挂在 .pp- 命名空间下，颜色走 DSH 主题 token。 */
export const STYLES = `
.pp-page {
  height: 100%;
  min-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
.pp-page *, .pp-page *::before, .pp-page *::after { box-sizing: border-box; }
.pp-page img { display: block; }
.pp-page ::selection { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, transparent); }
.pp-page ::-webkit-scrollbar { width: 10px; height: 10px; }
.pp-page ::-webkit-scrollbar-thumb {
  background: var(--dsw-alias-border-l2); border-radius: 999px;
  border: 2px solid var(--dsw-alias-bg-base);
}
.pp-page ::-webkit-scrollbar-track { background: transparent; }
.pp-page button { transition: background-color .15s ease, border-color .15s ease, transform .1s ease, box-shadow .15s ease; }
.pp-page button:not(:disabled):hover { filter: brightness(.985); }
.pp-page button:not(:disabled):active { transform: translateY(1px); }
.pp-page button:disabled { opacity: .45; cursor: not-allowed; }
.pp-page button:focus-visible, .pp-page input:focus-visible, .pp-page select:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px;
}
.pp-page summary { outline: none; }

.pp-shell { max-width: 1180px; margin: 0 auto; padding: 0 clamp(20px, 4vw, 44px) 72px; }

.pp-header {
  display: flex; align-items: flex-start; gap: 18px; flex-wrap: wrap;
  padding: 30px 0 22px;
}
.pp-title-wrap { display: flex; align-items: flex-start; gap: 12px; }
.pp-mark {
  width: 38px; height: 38px; flex: none; border-radius: 11px;
  display: grid; place-items: center; color: var(--dsw-alias-brand-primary);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, var(--dsw-alias-bg-layer-2));
  border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, var(--dsw-alias-border-l1));
}
.pp-title { margin: 0; font-size: 22px; font-weight: 650; letter-spacing: -.015em; }
.pp-subtitle { margin: 3px 0 0; color: var(--dsw-alias-label-secondary); font-size: 13px; max-width: 620px; }
.pp-header-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pp-lang {
  border: 1px solid var(--dsw-alias-border-l1); background: transparent;
  color: var(--dsw-alias-label-secondary); border-radius: 999px;
  padding: 5px 11px; font-size: 12px; font-weight: 600; cursor: pointer;
}
.pp-lang:hover { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }

.pp-muted { color: var(--dsw-alias-label-secondary); font-size: 12px; }
.pp-chip {
  display: inline-flex; align-items: center; background: var(--dsw-alias-bg-layer-2);
  border-radius: 999px; padding: 2px 9px; font-size: 11px;
  color: var(--dsw-alias-label-secondary); line-height: 1.6; white-space: nowrap;
}
.pp-error { color: var(--dsw-alias-state-danger-primary, #d0453a); font-size: 12px; }
.pp-section-title {
  font-size: 11px; font-weight: 700; letter-spacing: .06em;
  color: var(--dsw-alias-label-secondary); text-transform: uppercase;
}
.pp-card {
  background: var(--dsw-alias-bg-layer-1);
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 14px;
}
.pp-panel { padding: 16px; display: grid; gap: 12px; }

.pp-projects { display: grid; gap: 10px; }
.pp-project {
  display: grid; gap: 8px; width: 100%; text-align: left; padding: 16px 18px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 14px;
  background: var(--dsw-alias-bg-layer-1); color: inherit; font: inherit;
  cursor: pointer;
}
.pp-project:hover {
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, var(--dsw-alias-border-l1));
  box-shadow: 0 10px 26px rgba(0, 0, 0, .07); transform: translateY(-1px);
}
.pp-project-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pp-project-name { font-size: 15px; font-weight: 650; }
.pp-chevron { margin-left: auto; color: var(--dsw-alias-label-secondary); font-size: 15px; }
.pp-project-path {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px; color: var(--dsw-alias-label-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pp-project-meta { display: flex; gap: 6px; flex-wrap: wrap; }

.pp-empty {
  display: grid; gap: 12px; justify-items: center; text-align: center;
  padding: 56px 24px; border: 1px dashed var(--dsw-alias-border-l2);
  border-radius: 16px; background: var(--dsw-alias-bg-layer-1);
}
.pp-empty-icon {
  width: 52px; height: 52px; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-brand-primary);
}
.pp-empty h2 { margin: 0; font-size: 16px; font-weight: 600; }
.pp-empty p { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 13px; max-width: 420px; }

.pp-summary {
  padding: 18px 20px; display: grid; gap: 16px;
  background:
    linear-gradient(180deg,
      color-mix(in srgb, var(--dsw-alias-brand-primary) 4%, var(--dsw-alias-bg-layer-1)) 0%,
      var(--dsw-alias-bg-layer-1) 180px);
}
.pp-summary-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pp-project-title { font-size: 20px; font-weight: 650; letter-spacing: -.01em; }
.pp-pill {
  display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px;
  border-radius: 999px; font-size: 11px; font-weight: 600; line-height: 1.5;
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary);
  white-space: nowrap;
}
.pp-pill[data-tone="keep"] { background: color-mix(in srgb, #2f9e5f 16%, transparent); color: #237a49; }
.pp-pill[data-tone="maybe"] { background: color-mix(in srgb, #d09a2b 18%, transparent); color: #8a6415; }
.pp-pill[data-tone="reject"] { background: color-mix(in srgb, #cc4b3f 14%, transparent); color: #9c352c; }
.pp-pill[data-tone="live"] { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent); color: var(--dsw-alias-brand-primary); }
.pp-path {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px; color: var(--dsw-alias-label-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;
}
.pp-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(104px, 1fr)); gap: 8px; }
.pp-stat {
  display: grid; gap: 1px; padding: 10px 12px; border-radius: 12px;
  background: var(--dsw-alias-bg-layer-2);
}
.pp-stat-value { font-size: 20px; font-weight: 650; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.pp-stat-label { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.pp-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.pp-actions-end { margin-left: auto; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.pp-menu {
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 25;
  display: grid; gap: 4px; min-width: 180px; padding: 6px;
  background: var(--dsw-alias-bg-overlay); border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 12px; box-shadow: 0 16px 40px rgba(0, 0, 0, .18);
}
.pp-menu button { justify-content: flex-start !important; text-align: left; }

.pp-steps { display: flex; gap: 6px; flex-wrap: wrap; }
.pp-step {
  display: inline-flex; align-items: center; gap: 7px; padding: 5px 11px;
  border-radius: 999px; background: var(--dsw-alias-bg-layer-2);
  font-size: 12px; color: var(--dsw-alias-label-secondary);
}
.pp-step strong { font-weight: 600; color: var(--dsw-alias-label-primary); }
.pp-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--dsw-alias-border-l2); flex: none; }
.pp-dot[data-status="done"] { background: #2f9e5f; }
.pp-dot[data-status="running"] { background: var(--dsw-alias-brand-primary); animation: pp-pulse 1.2s ease-in-out infinite; }
.pp-dot[data-status="paused"] { background: #d09a2b; }
.pp-dot[data-status="failed"], .pp-dot[data-status="cancelled"] { background: #cc4b3f; }

.pp-progress { display: grid; gap: 5px; }
.pp-progress-track { height: 6px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); overflow: hidden; }
.pp-progress-fill {
  height: 100%; border-radius: 999px; background: var(--dsw-alias-brand-primary);
  transition: width .3s ease;
}

.pp-history { overflow: hidden; }
.pp-history > summary {
  display: flex; align-items: center; gap: 8px; padding: 14px 18px;
  cursor: pointer; list-style: none; font-size: 13px; font-weight: 600;
}
.pp-history > summary::-webkit-details-marker { display: none; }
.pp-history > summary::after { content: '⌄'; margin-left: auto; color: var(--dsw-alias-label-secondary); transition: transform .15s; }
.pp-history[open] > summary::after { transform: rotate(180deg); }
.pp-history-body { border-top: 1px solid var(--dsw-alias-border-l1); }
.pp-history-row {
  display: grid; grid-template-columns: 96px 88px 1fr auto; gap: 10px;
  align-items: center; padding: 10px 18px; font-size: 12px;
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.pp-history-row:first-child { border-top: 0; }
.pp-history-row strong { font-weight: 600; }
.pp-history-samples { padding: 0 18px 12px; }
.pp-history-samples > summary { cursor: pointer; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.pp-history-samples > div { display: grid; grid-template-columns: repeat(8, minmax(0, 84px)); gap: 8px; margin-top: 8px; }
.pp-history-samples img {
  width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 7px;
  background: var(--dsw-alias-bg-layer-2);
}

.pp-review { display: grid; gap: 12px; }
.pp-toolbar {
  position: sticky; top: 0; z-index: 12;
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 10px 12px; border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: color-mix(in srgb, var(--dsw-alias-bg-base) 86%, transparent);
  backdrop-filter: blur(12px);
}
.pp-seg {
  display: inline-flex; gap: 2px; padding: 3px; border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
}
.pp-seg button {
  border: 0 !important; background: transparent !important; padding: 5px 11px !important;
  border-radius: 999px !important; font-size: 12px !important; font-weight: 500;
  color: var(--dsw-alias-label-secondary) !important; cursor: pointer; box-shadow: none !important;
}
.pp-seg button.active {
  background: var(--dsw-alias-bg-layer-1) !important; color: var(--dsw-alias-label-primary) !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .1) !important;
}
.pp-toolbar select { padding: 5px 8px !important; font-size: 12px !important; }

.pp-wall { display: grid; grid-template-columns: repeat(auto-fill, minmax(158px, 1fr)); gap: 10px; }
.pp-tile-wrap { position: relative; }
.pp-tile {
  display: block; width: 100%; padding: 0 !important; border-radius: 12px !important;
  border: 1px solid var(--dsw-alias-border-l1) !important; overflow: hidden;
  background: var(--dsw-alias-bg-layer-2) !important; cursor: pointer; position: relative;
}
.pp-tile:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(0, 0, 0, .14); }
.pp-tile.selected { border-color: var(--dsw-alias-brand-primary) !important; box-shadow: 0 0 0 2px var(--dsw-alias-brand-primary); }
.pp-tile img { width: 100%; aspect-ratio: 1; object-fit: cover; }
.pp-tile-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; }
.pp-tile-score {
  position: absolute; top: 8px; left: 8px; padding: 2px 8px; border-radius: 999px;
  background: rgba(0, 0, 0, .62); color: #fff; font-size: 11px; font-weight: 600;
  backdrop-filter: blur(4px);
}
.pp-tile-human {
  position: absolute; right: 8px; bottom: 9px; padding: 2px 7px; border-radius: 999px;
  background: rgba(0, 0, 0, .62); color: #fff; font-size: 10px;
}
.pp-check {
  appearance: none; -webkit-appearance: none;
  position: absolute; top: 8px; right: 8px; width: 20px; height: 20px;
  margin: 0; cursor: pointer; border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, .92);
  background: rgba(0, 0, 0, .3); backdrop-filter: blur(6px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, .25);
  opacity: 0; transition: opacity .15s ease, background-color .15s ease, border-color .15s ease;
}
.pp-tile-wrap:hover .pp-check,
.pp-tile-wrap:focus-within .pp-check,
.pp-check:checked { opacity: 1; }
.pp-check:checked {
  background-color: var(--dsw-alias-brand-primary);
  border-color: var(--dsw-alias-brand-primary);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2.2 6.3 4.8 8.8 9.8 3.4' fill='none' stroke='white' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-size: 12px 12px; background-position: center; background-repeat: no-repeat;
}
@media (hover: none) { .pp-check { opacity: 1; } }
.pp-batch {
  position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%);
  z-index: 45; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 10px 12px; border-radius: 999px;
  background: var(--dsw-alias-bg-overlay); border: 1px solid var(--dsw-alias-border-l1);
  box-shadow: 0 18px 44px rgba(0, 0, 0, .28);
}
.pp-batch .pp-muted { padding-left: 4px; }

.pp-single { display: grid; gap: 12px; }
.pp-single-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pp-single-body {
  display: grid; grid-template-columns: minmax(0, 1fr) 308px;
  gap: 16px; align-items: start;
}
.pp-stage {
  display: grid; place-items: center; min-height: 320px; padding: 14px;
  border-radius: 16px; background: var(--dsw-alias-bg-layer-2);
  border: 1px solid var(--dsw-alias-border-l1);
}
.pp-stage img {
  max-width: 100%; max-height: 72vh; border-radius: 10px;
  object-fit: contain;
}
.pp-stage-frame { position: relative; display: inline-block; max-width: 100%; line-height: 0; }
.pp-stage-frame > img { display: block; }
.pp-guide { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
.pp-guide span { position: absolute; background: rgba(255, 255, 255, .72); box-shadow: 0 0 2px rgba(0, 0, 0, .55); }
.pp-guide .v { top: 0; bottom: 0; width: 1px; }
.pp-guide .h { left: 0; right: 0; height: 1px; }
.pp-stage-tools {
  position: absolute; top: 10px; left: 10px; z-index: 2;
  display: flex; gap: 4px; line-height: 1.2;
}
.pp-tool-btn {
  padding: 4px 8px; border-radius: 999px; cursor: pointer;
  border: 1px solid rgba(255, 255, 255, .28);
  background: rgba(0, 0, 0, .5); color: #fff;
  font-size: 11px; line-height: 1.2;
  backdrop-filter: blur(6px);
}
.pp-tool-btn[aria-pressed="true"] {
  background: var(--dsw-alias-brand-primary);
  border-color: var(--dsw-alias-brand-primary);
  color: #fff;
}
.pp-photo-badge {
  position: absolute; top: 10px; right: 10px; z-index: 2;
  padding: 4px 9px; border-radius: 999px; cursor: pointer;
  border: 1px solid rgba(255, 255, 255, .28);
  background: rgba(0, 0, 0, .58); color: #fff;
  font-size: 11px; line-height: 1.2;
  backdrop-filter: blur(6px);
}
.pp-photo-badge:hover { border-color: rgba(255, 255, 255, .55); }
.pp-meters { display: grid; gap: 8px; }
.pp-meter {
  display: grid; grid-template-columns: 58px 1fr 24px; gap: 8px;
  align-items: center; font-size: 12px;
}
.pp-meter-track { height: 6px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); overflow: hidden; }
.pp-meter-fill { height: 100%; border-radius: 999px; background: var(--dsw-alias-brand-primary); }
.pp-kbd {
  font-size: 11px; line-height: 1.6; color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-bg-layer-2); border-radius: 9px; padding: 7px 9px;
}
.pp-reason { font-size: 13px; line-height: 1.65; }
.pp-chips { display: flex; gap: 6px; flex-wrap: wrap; }

.pp-compare-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
.pp-compare-card {
  position: relative; padding: 0 !important; overflow: hidden; cursor: pointer;
  border-radius: 12px !important; border: 2px solid transparent !important;
  background: var(--dsw-alias-bg-layer-2) !important;
}
.pp-compare-card.selected {
  border-color: var(--dsw-alias-brand-primary) !important;
  box-shadow: 0 0 0 2px var(--dsw-alias-brand-primary);
}
.pp-compare-card img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }
.pp-compare-badge {
  position: absolute; top: 8px; left: 8px; padding: 2px 8px; border-radius: 999px;
  background: rgba(0, 0, 0, .62); color: #fff; font-size: 11px; font-weight: 600;
}

.pp-overlay {
  position: fixed; inset: 0; z-index: 80; display: grid; place-items: center;
  padding: 20px; background: rgba(0, 0, 0, .38); backdrop-filter: blur(3px);
}
.pp-modal {
  width: min(680px, 94vw); max-height: 88vh; overflow: auto;
  display: grid; gap: 14px; padding: 20px;
  background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary);
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 16px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, .3);
  animation: pp-rise .18s ease;
}
.pp-modal-head { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 650; }
.pp-modal-head button { margin-left: auto; }
.pp-drawer {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 80;
  width: min(460px, 96vw); overflow: auto; display: grid; gap: 16px; align-content: start;
  padding: 20px; background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary);
  border-left: 1px solid var(--dsw-alias-border-l1);
  box-shadow: -24px 0 70px rgba(0, 0, 0, .25);
  animation: pp-slide .18s ease;
}
.pp-form { display: grid; gap: 12px; }
.pp-field { display: grid; gap: 5px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.pp-row { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; }
.pp-row .pp-field { flex: 1; min-width: 96px; }
.pp-callout {
  padding: 10px 12px; border-radius: 10px; background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.6;
}
.pp-form pre {
  white-space: pre-wrap; font-size: 11px; line-height: 1.55; margin: 6px 0 0;
  padding: 10px; border-radius: 8px; background: var(--dsw-alias-bg-layer-2);
  max-height: 260px; overflow: auto;
}
.pp-checks { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
.pp-checks label { display: inline-flex; gap: 6px; align-items: center; font-size: 13px; }

.pp-toast {
  position: fixed; right: 24px; bottom: 24px; z-index: 95; max-width: 380px;
  display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px;
  background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary);
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, .26); font-size: 13px;
  animation: pp-rise .18s ease;
}
.pp-toast[data-kind="done"] { border-left: 4px solid #2f9e5f; }
.pp-toast[data-kind="paused"] { border-left: 4px solid #d09a2b; }
.pp-toast[data-kind="failed"] { border-left: 4px solid #cc4b3f; }

@keyframes pp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
@keyframes pp-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes pp-slide { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }

@media (max-width: 880px) {
  .pp-single-body { grid-template-columns: 1fr; }
  .pp-wall { grid-template-columns: repeat(auto-fill, minmax(128px, 1fr)); }
}
@media (prefers-reduced-motion: reduce) {
  .pp-page *, .pp-page *::before, .pp-page *::after {
    animation: none !important; transition: none !important;
  }
}
`

export function installStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById('dsh-photo-picker-styles') !== null) return
  const style = document.createElement('style')
  style.id = 'dsh-photo-picker-styles'
  style.textContent = STYLES
  document.head.appendChild(style)
}
