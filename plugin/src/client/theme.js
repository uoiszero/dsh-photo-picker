/** 工作台界面样式：注入一次，全部挂在 .pp- 命名空间下，颜色走 DSH 主题 token。 */
export const STYLES = `
.pp-page {
  --pp-space-1: 4px; --pp-space-2: 8px; --pp-space-3: 12px;
  --pp-space-4: 16px; --pp-space-5: 24px; --pp-space-6: 32px;
  --pp-radius-control: 8px; --pp-radius-card: 14px;
  --pp-control-h: 34px; --pp-control-h-sm: 30px;
  --pp-status-keep: #2f9e5f; --pp-status-maybe: #d09a2b; --pp-status-reject: #cc4b3f;
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

.pp-button {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: var(--pp-control-h); padding: 7px 13px; border-radius: var(--pp-radius-control);
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary);
  font-size: 13px; font-weight: 500; line-height: 1.3;
  white-space: nowrap; cursor: pointer;
}
.pp-button-primary {
  background: var(--dsw-alias-button-primary-fill);
  border-color: transparent;
  color: var(--dsw-alias-label-primary-foreground);
  font-weight: 600;
}
.pp-button-danger {
  background: color-mix(in srgb, var(--dsw-alias-state-danger-primary, #cc4b3f) 10%, var(--dsw-alias-bg-layer-1));
  border-color: color-mix(in srgb, var(--dsw-alias-state-danger-primary, #cc4b3f) 34%, var(--dsw-alias-border-l1));
  color: var(--dsw-alias-state-danger-primary, #a93b32);
}
.pp-button-danger:hover { border-color: var(--dsw-alias-state-danger-primary, #a93b32); }
.pp-button-sm { min-height: var(--pp-control-h-sm); padding: 5px 10px; font-size: 12px; }
.pp-page-nav { display: flex; align-items: center; min-height: 30px; }
.pp-back {
  display: inline-flex; align-items: center; gap: 5px;
  height: 30px; padding: 0 10px 0 8px;
  border: 1px solid transparent; border-radius: 8px;
  background: transparent; color: var(--dsw-alias-label-secondary);
  font-size: 13px; font-weight: 500; line-height: 1; cursor: pointer;
}
.pp-back svg { flex: none; opacity: .8; }
.pp-back:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.pp-close {
  width: 30px; height: 30px; padding: 0; flex: none;
  display: grid; place-items: center;
  border: 1px solid transparent; border-radius: 8px;
  background: transparent; color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.pp-close:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.pp-modal-head .pp-close { margin-left: auto; }

.pp-muted { color: var(--dsw-alias-label-secondary); font-size: 12px; }
.pp-scene-chips { display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; }
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
.pp-project-wrap { position: relative; }
.pp-project-wrap .pp-project { padding-right: 18px; }
.pp-project-delete {
  position: absolute; top: 15px; right: 18px; z-index: 1;
  width: 28px; height: 28px; display: grid; place-items: center;
  padding: 0; border-radius: 8px;
  border: 1px solid transparent; background: transparent;
  color: var(--dsw-alias-label-secondary); cursor: pointer;
  opacity: 0; transition: opacity .15s ease, background-color .15s ease, color .15s ease, border-color .15s ease;
}
.pp-project-wrap:hover .pp-project-delete, .pp-project-wrap:focus-within .pp-project-delete, .pp-project-delete:focus-visible { opacity: 1; }
.pp-project-wrap:hover .pp-project-delete, .pp-project-wrap:focus-within .pp-project-delete { transform: translateY(-1px); }
.pp-project-wrap:hover .pp-chevron, .pp-project-wrap:focus-within .pp-chevron { opacity: 0; }
.pp-project-delete:hover {
  color: var(--dsw-alias-state-danger-primary, #cc4b3f);
  background: color-mix(in srgb, var(--dsw-alias-state-danger-primary, #cc4b3f) 9%, var(--dsw-alias-bg-layer-1));
  border-color: color-mix(in srgb, var(--dsw-alias-state-danger-primary, #cc4b3f) 24%, var(--dsw-alias-border-l1));
}
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
.pp-project-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.pp-project-spent { margin-left: auto; color: var(--dsw-alias-label-secondary); font-size: 11px; white-space: nowrap; }

.pp-state {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px; border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
}
.pp-state-error {
  border-color: color-mix(in srgb, var(--dsw-alias-state-danger-primary, #cc4b3f) 38%, var(--dsw-alias-border-l1));
  background: color-mix(in srgb, var(--dsw-alias-state-danger-primary, #cc4b3f) 5%, var(--dsw-alias-bg-layer-1));
}
.pp-state-icon {
  width: 30px; height: 30px; flex: none; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary);
  font-size: 14px; font-weight: 700;
}
.pp-state-error .pp-state-icon {
  background: color-mix(in srgb, var(--dsw-alias-state-danger-primary, #cc4b3f) 12%, transparent);
  color: var(--dsw-alias-state-danger-primary, #cc4b3f);
}
.pp-state-copy { display: grid; gap: 2px; flex: 1; min-width: 0; }
.pp-state-copy strong { font-size: 13px; font-weight: 600; }
.pp-state-copy span { color: var(--dsw-alias-label-secondary); font-size: 12px; overflow-wrap: anywhere; }
.pp-spinner {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid var(--dsw-alias-border-l2); border-top-color: var(--dsw-alias-brand-primary);
  animation: pp-spin .7s linear infinite;
}
@keyframes pp-spin { to { transform: rotate(360deg); } }
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
.pp-detail { display: grid; gap: 16px; }
.pp-summary-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pp-project-title { font-size: 20px; font-weight: 650; letter-spacing: -.01em; }
.pp-pill {
  display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px;
  border-radius: 999px; font-size: 11px; font-weight: 600; line-height: 1.5;
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary);
  white-space: nowrap;
}
.pp-pill[data-tone="keep"] { background: color-mix(in srgb, var(--pp-status-keep) 16%, transparent); color: color-mix(in srgb, var(--pp-status-keep) 58%, var(--dsw-alias-label-primary)); }
.pp-pill[data-tone="maybe"] { background: color-mix(in srgb, var(--pp-status-maybe) 18%, transparent); color: color-mix(in srgb, var(--pp-status-maybe) 58%, var(--dsw-alias-label-primary)); }
.pp-pill[data-tone="reject"] { background: color-mix(in srgb, var(--pp-status-reject) 14%, transparent); color: color-mix(in srgb, var(--pp-status-reject) 58%, var(--dsw-alias-label-primary)); }
.pp-pill[data-tone="live"] { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent); color: var(--dsw-alias-brand-primary); }
.pp-summary-path { margin-left: auto; max-width: 46%; }
.pp-path {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px; color: var(--dsw-alias-label-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;
}
.pp-calibration-summary { display: grid; gap: 12px; }
.pp-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(104px, 1fr)); gap: 8px; }
.pp-stat {
  display: grid; gap: 1px; padding: 10px 12px; border-radius: 12px;
  background: var(--dsw-alias-bg-layer-2);
}
.pp-stat-value { font-size: 20px; font-weight: 650; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.pp-stat-label { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.pp-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.pp-actions-right { justify-content: flex-end; }
.pp-modal-foot { display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
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
.pp-dot[data-status="done"] { background: var(--pp-status-keep); }
.pp-dot[data-status="running"] { background: var(--dsw-alias-brand-primary); animation: pp-pulse 1.2s ease-in-out infinite; }
.pp-dot[data-status="paused"] { background: var(--pp-status-maybe); }
.pp-dot[data-status="failed"], .pp-dot[data-status="cancelled"] { background: var(--pp-status-reject); }

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
.pp-history-count { margin-left: 6px; }
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
.pp-toolbar-group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
.pp-toolbar-end { margin-left: auto; }
.pp-toolbar-field { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
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

.pp-load-more { padding: 18px 0 4px; text-align: center; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.pp-wall { position: relative; }
.pp-wall-row { position: absolute; left: 0; right: 0; display: grid; gap: 10px; }
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
.pp-tile-scenes {
  position: absolute; left: 8px; bottom: 9px; max-width: calc(100% - 80px);
  padding: 2px 7px; border-radius: 999px;
  background: rgba(0, 0, 0, .62); color: #fff;
  font-size: 10px; line-height: 1.5; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
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
@media (hover: none) { .pp-check { opacity: 1; } .pp-project-delete { opacity: 1; } .pp-project-wrap .pp-chevron { display: none; } }
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
.pp-stage-scenes {
  position: absolute; left: 10px; bottom: 10px; z-index: 2;
  max-width: calc(100% - 20px); padding: 4px 9px; border-radius: 999px;
  background: rgba(0, 0, 0, .58); color: #fff;
  font-size: 11px; line-height: 1.3; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
  backdrop-filter: blur(6px);
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

.pp-drawer-scrim { position: fixed; inset: 0; z-index: 80; background: rgba(0, 0, 0, .32); }
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
.pp-tabs {
  display: flex; width: 100%; padding: 3px; gap: 3px;
  border-radius: 11px; background: var(--dsw-alias-bg-layer-2);
  border: 1px solid var(--dsw-alias-border-l1);
}
.pp-tab {
  flex: 1 1 0; min-width: 0; padding: 8px 12px;
  border: 0 !important; border-radius: 8px;
  background: transparent; color: var(--dsw-alias-label-secondary);
  font-size: 13px; font-weight: 500; line-height: 1.35;
  cursor: pointer; text-align: center;
}
.pp-tab:hover { color: var(--dsw-alias-label-primary); }
.pp-tab[aria-selected="true"] {
  background: var(--dsw-alias-bg-overlay);
  color: var(--dsw-alias-label-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, .14);
}
.pp-form { display: grid; gap: 12px; }
.pp-recipe-card-head { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.pp-recipe-card-head .pp-section-title { margin: 0; }
.pp-recipe-card-head .pp-button { margin-left: auto; }
.pp-recipe-source { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pp-recipe-editor-grid { display: grid; gap: 14px; margin-top: 8px; }
.pp-recipe-actions { display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 8px; }
.pp-crop-summary { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; }
.pp-crop-summary > .pp-muted { min-width: 0; }
.pp-crop-toolbar { display: grid; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--dsw-alias-border-l1); }
.pp-crop-ratios { display: flex; flex-wrap: wrap; gap: 5px; }
.pp-crop-ratio {
  min-height: 28px; padding: 3px 8px; border-radius: 7px; cursor: pointer;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary); font-size: 11px; font-weight: 500;
}
.pp-crop-ratio:hover { border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
.pp-crop-ratio.active { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, var(--dsw-alias-bg-layer-1)); }
.pp-crop-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 5px; }
.pp-crop-layer { position: absolute; inset: 0; z-index: 6; touch-action: none; user-select: none; }
.pp-crop-mask { position: absolute; background: rgba(0, 0, 0, .48); pointer-events: none; }
.pp-crop-selection { position: absolute; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, .7); cursor: move; touch-action: none; }
.pp-crop-handle { position: absolute; width: 12px; height: 12px; border-radius: 3px; border: 1.5px solid #fff; background: rgba(0, 0, 0, .52); }
.pp-crop-handle-nw { left: -7px; top: -7px; cursor: nwse-resize; }
.pp-crop-handle-n { left: calc(50% - 6px); top: -7px; cursor: ns-resize; }
.pp-crop-handle-ne { right: -7px; top: -7px; cursor: nesw-resize; }
.pp-crop-handle-e { right: -7px; top: calc(50% - 6px); cursor: ew-resize; }
.pp-crop-handle-se { right: -7px; bottom: -7px; cursor: nwse-resize; }
.pp-crop-handle-s { left: calc(50% - 6px); bottom: -7px; cursor: ns-resize; }
.pp-crop-handle-sw { left: -7px; bottom: -7px; cursor: nesw-resize; }
.pp-crop-handle-w { left: -7px; top: calc(50% - 6px); cursor: ew-resize; }
.pp-recipe-control { display: grid; gap: 4px; }
.pp-recipe-control-head { display: flex; justify-content: space-between; align-items: baseline; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.pp-recipe-value { font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-primary); }
.pp-range { width: 100%; height: 22px; margin: 0; accent-color: var(--dsw-alias-brand-primary); cursor: pointer; }
.pp-dir-list { max-height: 220px; overflow: auto; padding: 4px; }
.pp-dir-row { display: block; width: 100%; padding: 7px 10px; border: 0; border-radius: 8px; background: transparent; color: inherit; font-size: 13px; text-align: left; cursor: pointer; }
.pp-dir-row:hover { background: var(--dsw-alias-bg-layer-2); }
.pp-form > .pp-section-title { margin-top: 6px; padding-top: 12px; border-top: 1px solid var(--dsw-alias-border-l1); }
.pp-form > .pp-section-title:first-child { margin-top: 0; padding-top: 0; border-top: 0; }
.pp-drawer .pp-modal-foot {
  position: sticky; bottom: -20px; z-index: 2;
  margin: 0 -20px -20px; padding: 12px 20px;
  background: var(--dsw-alias-bg-overlay);
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.pp-field { display: grid; gap: 5px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.pp-field-narrow { max-width: 140px; }
.pp-field-help { font-size: 11px; color: var(--dsw-alias-label-secondary); line-height: 1.45; }
.pp-section { display: grid; gap: 12px; }
.pp-section-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pp-section-head h2 { margin: 0; font-size: 16px; font-weight: 650; letter-spacing: -.01em; }
.pp-section-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pp-input, .pp-select {
  height: var(--pp-control-h); padding: 0 10px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: var(--pp-radius-control);
  background-color: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-size: 13px; line-height: 1.3; min-width: 0;
}
.pp-input:hover, .pp-select:hover { border-color: var(--dsw-alias-border-l2); }
.pp-input::placeholder { color: var(--dsw-alias-label-secondary); opacity: .8; }
.pp-select {
  appearance: none; -webkit-appearance: none;
  padding-right: 30px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='m2.5 4.5 3.5 3.5 3.5-3.5' fill='none' stroke='%23888f98' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center; background-size: 12px 12px;
}
.pp-select-sm {
  height: var(--pp-control-h-sm); padding: 0 26px 0 9px; font-size: 12px;
  background-position: right 8px center;
}
.pp-input:disabled, .pp-select:disabled { opacity: .55; cursor: not-allowed; }

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
.pp-toast[data-kind="done"] { border-left: 4px solid var(--pp-status-keep); }
.pp-toast[data-kind="paused"] { border-left: 4px solid var(--pp-status-maybe); }
.pp-toast[data-kind="failed"] { border-left: 4px solid var(--pp-status-reject); }

@keyframes pp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
@keyframes pp-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes pp-slide { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }

@media (max-width: 880px) {
  .pp-single-body { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
  .pp-shell { padding: 0 16px 56px; }
  .pp-header { padding: 22px 0 16px; }
  .pp-summary-top .pp-path { margin-left: 0 !important; max-width: 100%; width: 100%; }
  .pp-toolbar { position: static; padding: 9px 10px; }
  .pp-toolbar .pp-seg { flex: 1 1 100%; overflow-x: auto; }
  .pp-toolbar-end { margin-left: 0; width: 100%; }
  .pp-toolbar-field { flex: 1; }
  .pp-modal { width: calc(100vw - 24px); padding: 16px; }
  .pp-drawer { width: 100vw; padding: 16px; }
  .pp-project-wrap { position: relative; }
.pp-project-wrap .pp-project { padding-right: 18px; }
.pp-project-delete {
  position: absolute; top: 15px; right: 18px; z-index: 1;
  width: 28px; height: 28px; display: grid; place-items: center;
  padding: 0; border-radius: 8px;
  border: 1px solid transparent; background: transparent;
  color: var(--dsw-alias-label-secondary); cursor: pointer;
  opacity: 0; transition: opacity .15s ease, background-color .15s ease, color .15s ease, border-color .15s ease;
}
.pp-project-wrap:hover .pp-project-delete, .pp-project-wrap:focus-within .pp-project-delete, .pp-project-delete:focus-visible { opacity: 1; }
.pp-project-wrap:hover .pp-project-delete, .pp-project-wrap:focus-within .pp-project-delete { transform: translateY(-1px); }
.pp-project-wrap:hover .pp-chevron, .pp-project-wrap:focus-within .pp-chevron { opacity: 0; }
.pp-project-delete:hover {
  color: var(--dsw-alias-state-danger-primary, #cc4b3f);
  background: color-mix(in srgb, var(--dsw-alias-state-danger-primary, #cc4b3f) 9%, var(--dsw-alias-bg-layer-1));
  border-color: color-mix(in srgb, var(--dsw-alias-state-danger-primary, #cc4b3f) 24%, var(--dsw-alias-border-l1));
}
.pp-project { padding: 14px; }
  .pp-history-row { grid-template-columns: 1fr auto; }
}
@media (max-width: 480px) {
  .pp-header-actions { width: 100%; justify-content: flex-end; }
  .pp-title { font-size: 20px; }
  .pp-summary-top { align-items: flex-start; }
  .pp-tabs { padding: 2px; }
  .pp-tab { padding: 7px 8px; font-size: 12px; }
  .pp-seg { flex: 1 1 100%; width: 100%; }
  .pp-seg button { flex: 1; padding-left: 6px !important; padding-right: 6px !important; }
  .pp-toolbar-field { width: 100%; }
  .pp-toolbar-field .pp-select { flex: 1; }
  .pp-actions .pp-button { flex: 1 1 auto; }
  .pp-overlay { padding: 0; }
  .pp-modal { width: 100vw; max-height: 100vh; border-radius: 0; }
  .pp-drawer { width: 100vw; }
  .pp-history-row { grid-template-columns: 1fr; }
}

.pp-single-visual { display: grid; gap: 10px; align-content: start; min-width: 0; }
.pp-crop-panel {
  display: grid; gap: 10px; padding: 12px 14px;
  border-radius: 14px; border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
}
.pp-crop-panel-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.pp-crop-panel-head strong { font-size: 13px; font-weight: 650; }
.pp-crop-panel-head .pp-muted { font-size: 11px; text-align: right; }
.pp-crop-angle { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.pp-crop-angle > span:first-child { width: 34px; flex: none; }
.pp-crop-angle-range { flex: 1; min-width: 80px; height: 22px; accent-color: var(--dsw-alias-brand-primary); cursor: pointer; }
.pp-crop-angle-value { width: 44px; flex: none; text-align: right; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-primary); }
.pp-crop-ratios { display: flex; align-items: stretch; gap: 6px; overflow-x: auto; padding: 2px 1px 4px; scrollbar-width: thin; }
.pp-crop-ratio {
  flex: 0 0 56px; min-height: 52px; display: grid; place-items: center; align-content: center; gap: 4px;
  padding: 5px 2px; border-radius: 9px; border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary);
  font-size: 10px; line-height: 1.2; cursor: pointer;
}
.pp-crop-ratio:hover { border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
.pp-crop-ratio.active { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, var(--dsw-alias-bg-layer-1)); }
.pp-crop-ratio-icon { display: block; width: 24px; height: 17px; border: 1.5px solid currentColor; border-radius: 2px; }
.pp-crop-ratio-icon[data-ratio="4:3"] { width: 23px; height: 17px; }
.pp-crop-ratio-icon[data-ratio="5:4"] { width: 21px; height: 17px; }
.pp-crop-ratio-icon[data-ratio="1:1"] { width: 18px; height: 18px; }
.pp-crop-ratio-icon[data-ratio="16:9"] { width: 25px; height: 14px; }
.pp-crop-ratio-icon[data-ratio="16:10"] { width: 24px; height: 15px; }
.pp-crop-ratio-icon[data-ratio="3:2"] { width: 24px; height: 16px; }
.pp-crop-ratio-icon[data-ratio="original"] { width: 24px; height: 17px; border-width: 2px; }
.pp-crop-ratio-icon-free { border-style: dashed; border-radius: 3px; }
.pp-crop-actions { display: flex; align-items: stretch; justify-content: flex-end; gap: 8px; flex-wrap: wrap; padding-top: 2px; }
.pp-crop-action {
  min-width: 64px; min-height: 48px; display: grid; place-items: center; align-content: center; gap: 3px;
  padding: 4px 8px; border-radius: 9px; border: 1px solid transparent;
  background: transparent; color: var(--dsw-alias-label-secondary);
  font-size: 10px; line-height: 1.2; cursor: pointer;
}
.pp-crop-action:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.pp-crop-action:disabled { opacity: .4; cursor: not-allowed; }
.pp-crop-action-primary { color: var(--dsw-alias-label-primary-foreground); background: var(--dsw-alias-button-primary-fill); border-color: transparent; }
.pp-crop-action-primary:hover { color: var(--dsw-alias-label-primary-foreground); filter: brightness(1.03); }
.pp-crop-action-glyph { font-size: 18px; line-height: 1; }
.pp-crop-thirds { position: absolute; inset: 0; pointer-events: none; }
.pp-crop-thirds span { position: absolute; background: rgba(255, 255, 255, .7); box-shadow: 0 0 2px rgba(0, 0, 0, .5); }
.pp-crop-thirds .v { top: 0; bottom: 0; width: 1px; }
.pp-crop-thirds .h { left: 0; right: 0; height: 1px; }

.pp-stage-cropping img { max-height: 52vh; }
.pp-stage-cropping { min-height: 260px; padding: 10px; }

.pp-focus-bar {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  position: sticky; top: 8px; z-index: 20; margin-bottom: 10px;
  padding: 8px 12px; border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: color-mix(in srgb, var(--dsw-alias-bg-base) 92%, transparent);
  backdrop-filter: blur(12px);
}
.pp-focus-name { font-size: 14px; font-weight: 650; }
.pp-focus-bar .pp-muted { font-size: 11px; }
.pp-detail-focused .pp-single { gap: 8px; }
.pp-crop-panel { position: sticky; bottom: 10px; z-index: 9; box-shadow: 0 10px 30px rgba(0, 0, 0, .12); }

.pp-crop-handle {
  width: 28px; height: 28px; padding: 0; border: 0; background: transparent;
}
.pp-crop-handle::after {
  content: ''; position: absolute; inset: 8px; width: 12px; height: 12px;
  border-radius: 3px; border: 1.5px solid #fff; background: rgba(0, 0, 0, .52);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .35);
}
.pp-crop-handle-nw { left: -14px; top: -14px; cursor: nwse-resize; }
.pp-crop-handle-n { left: calc(50% - 14px); top: -14px; cursor: ns-resize; }
.pp-crop-handle-ne { right: -14px; top: -14px; cursor: nesw-resize; }
.pp-crop-handle-e { right: -14px; top: calc(50% - 14px); cursor: ew-resize; }
.pp-crop-handle-se { right: -14px; bottom: -14px; cursor: nwse-resize; }
.pp-crop-handle-s { left: calc(50% - 14px); bottom: -14px; cursor: ns-resize; }
.pp-crop-handle-sw { left: -14px; bottom: -14px; cursor: nesw-resize; }
.pp-crop-handle-w { left: -14px; top: calc(50% - 14px); cursor: ew-resize; }
.pp-crop-handle:focus-visible, .pp-crop-selection:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px;
}
.pp-crop-ratios { scroll-snap-type: x proximity; overscroll-behavior-x: contain; }
.pp-crop-ratio { scroll-snap-align: start; }
.pp-crop-ratio:last-child { margin-right: 1px; }


.pp-view-tabs { display: flex; gap: 4px; margin: 10px 0 12px; padding: 3px; width: fit-content; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); }
.pp-view-tabs button { border: 0; background: transparent; padding: 6px 14px; border-radius: 999px; cursor: pointer; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.pp-view-tabs button.active { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); box-shadow: 0 1px 2px rgba(0, 0, 0, .1); }
.pp-global-wall { display: grid; gap: 12px; }
.pp-global-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pp-project-picker { position: relative; font-size: 12px; }
.pp-project-picker > summary { cursor: pointer; padding: 5px 9px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); list-style: none; }
.pp-project-picker > summary::-webkit-details-marker { display: none; }
.pp-project-picker-menu { position: absolute; top: calc(100% + 4px); left: 0; z-index: 30; width: 260px; max-width: calc(100vw - 40px); max-height: 280px; overflow: auto; padding: 7px; border-radius: 10px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-overlay); box-shadow: 0 12px 30px rgba(0, 0, 0, .2); }
.pp-project-picker-menu label { display: flex; align-items: center; gap: 7px; min-width: 0; padding: 5px 6px; border-radius: 6px; cursor: pointer; }
.pp-project-picker-menu label:hover { background: var(--dsw-alias-bg-layer-2); }
.pp-project-option { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pp-project-picker-all { border-bottom: 1px solid var(--dsw-alias-border-l1); margin-bottom: 4px; font-weight: 600; }
.pp-filter-chips { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.pp-filter-label { width: 42px; flex: none; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.pp-filter-chip { border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); border-radius: 999px; padding: 4px 9px; font-size: 11px; cursor: pointer; }
.pp-filter-chip:hover { border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
.pp-filter-chip.active { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, var(--dsw-alias-bg-layer-1)); }
.pp-global-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.pp-global-project { position: absolute; right: 8px; top: 8px; max-width: calc(100% - 50px); padding: 2px 7px; border-radius: 999px; background: rgba(0, 0, 0, .62); color: #fff; font-size: 10px; line-height: 1.5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; backdrop-filter: blur(4px); }
.pp-global-lightbox { display: grid; gap: 10px; }
.pp-global-lightbox img { display: block; max-width: 100%; max-height: 62vh; margin: 0 auto; object-fit: contain; border-radius: 8px; }
.pp-ai-runs { padding: 0; }
.pp-ai-runs > summary { padding: 10px 12px; cursor: pointer; }
.pp-ai-runs-body { display: grid; gap: 7px; padding: 0 12px 12px; }
.pp-ai-run-row { padding: 8px 9px; border-radius: 8px; background: var(--dsw-alias-bg-layer-2); }
.pp-ai-run-main { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; font-size: 12px; }
.pp-ai-run-stats { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.pp-export-projects { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
.pp-export-summary { display: grid; gap: 4px; padding: 8px; border-radius: 8px; background: var(--dsw-alias-bg-layer-2); }

.pp-export-fields { display: grid; grid-template-columns: max-content minmax(0, 1fr); column-gap: 10px; row-gap: 8px; align-items: center; }
.pp-export-label { font-size: 11px; color: var(--dsw-alias-label-secondary); white-space: nowrap; line-height: 1.35; }
.pp-option-group { display: inline-grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 8px 14px; align-items: center; width: max-content; max-width: 100%; }
.pp-option-group-wrap { display: grid; grid-template-columns: repeat(auto-fit, 96px); grid-auto-flow: row; width: auto; }
.pp-export-fields .pp-option { width: 96px; }
.pp-export-fields .pp-option-group-span { grid-column: 2 / -1; }
.pp-export-fields .pp-option-group-span .pp-option { width: auto; }
.pp-option-group-primary { grid-auto-columns: 96px; width: max-content; }
.pp-option-group-scene .pp-option, .pp-option-group-primary .pp-option { width: 96px; }
.pp-option { display: inline-flex; align-items: center; gap: 5px; min-width: 0; padding: 0; border: 0; border-radius: 0; background: transparent; color: var(--dsw-alias-label-primary); font-size: 13px; cursor: pointer; }
.pp-option:hover { color: var(--dsw-alias-brand-primary); }
.pp-option:has(input:disabled) { opacity: .5; cursor: not-allowed; }
.pp-option input { margin: 0; accent-color: var(--dsw-alias-brand-primary); }
.pp-run-tabs { display: inline-flex; gap: 3px; padding: 3px; margin-bottom: 3px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); }
.pp-run-tabs button { border: 0; background: transparent; padding: 5px 10px; border-radius: 999px; color: var(--dsw-alias-label-secondary); font-size: 11px; cursor: pointer; }
.pp-run-tabs button.active { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); box-shadow: 0 1px 2px rgba(0, 0, 0, .1); }
.pp-run-ai-row { display: grid; gap: 3px; }
.pp-run-meta { display: flex; gap: 10px; flex-wrap: wrap; padding: 0 0 4px 2px; font-size: 11px; color: var(--dsw-alias-label-secondary); }

.pp-export-progress { display: grid; gap: 5px; padding: 8px 0 2px; }
.pp-export-progress-head { display: flex; justify-content: space-between; gap: 10px; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.pp-export-progress .pp-progress-track { height: 7px; }
.pp-export-progress .pp-progress-fill { transition: width .12s linear; }

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
