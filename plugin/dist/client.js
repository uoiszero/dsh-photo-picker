window.__ModuleLoader__.load({
  id: 'dsh-photo-picker',
  factory(require) {
    const module = { exports: {} };
    const exports = module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// plugin/src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react = __toESM(require("react"), 1);
var h = import_react.default.createElement;
var Fragment = import_react.default.Fragment;
var NS = "photoPicker";
var PANEL_ID = "photo-picker";
var zh = {
  title: "\u7167\u7247\u5DE5\u4F5C\u53F0",
  subtitle: "\u9009\u62E9\u672C\u673A\u7167\u7247\u6587\u4EF6\u5939\uFF0C\u626B\u63CF\u5E76\u505A\u672C\u5730\u9884\u5904\u7406\uFF08\u53BB\u91CD / \u6280\u672F\u8FC7\u6EE4 / \u5206\u7EC4\uFF09\u3002",
  newProject: "\u65B0\u5EFA\u9879\u76EE",
  folder: "\u7167\u7247\u6587\u4EF6\u5939",
  choose: "\u7528\u7CFB\u7EDF\u5BF9\u8BDD\u6846\u9009\u62E9",
  browse: "\u6D4F\u89C8",
  name: "\u9879\u76EE\u540D",
  theme: "\u9898\u6750",
  budget: "\u9884\u7B97\uFF08\u5143\uFF09",
  create: "\u521B\u5EFA\u9879\u76EE",
  creating: "\u521B\u5EFA\u4E2D\u2026",
  projectList: "\u9879\u76EE",
  projects: "\u9879\u76EE",
  back: "\u8FD4\u56DE\u9879\u76EE\u5217\u8868",
  scan: "\u5F00\u59CB\u626B\u63CF",
  preprocess: "\u5F00\u59CB\u9884\u5904\u7406",
  running: "\u8FD0\u884C\u4E2D",
  empty: "\u8FD8\u6CA1\u6709\u9879\u76EE\u3002\u5148\u9009\u62E9\u7167\u7247\u6587\u4EF6\u5939\uFF0C\u5EFA\u4E00\u4E2A\u9879\u76EE\u3002",
  noPhotos: "\u8FD8\u6CA1\u6709\u7F29\u7565\u56FE\u3002\u5148\u300C\u5F00\u59CB\u626B\u63CF\u300D\uFF0C\u518D\u300C\u5F00\u59CB\u9884\u5904\u7406\u300D\u3002",
  loading: "\u52A0\u8F7D\u4E2D\u2026",
  themeMixed: "\u6DF7\u5408",
  themePortrait: "\u4EBA\u50CF",
  themeLandscape: "\u98CE\u5149",
  themeEvent: "\u6D3B\u52A8",
  statusCreated: "\u65B0\u5EFA",
  statusScanned: "\u5DF2\u626B\u63CF",
  statusPreprocessed: "\u5DF2\u9884\u5904\u7406",
  statusGridded: "\u5DF2\u7C97\u7B5B",
  statusScored: "\u5DF2\u8BC4\u5206",
  statusPaused: "\u5DF2\u6682\u505C",
  statusFailed: "\u5931\u8D25",
  stageScan: "\u626B\u63CF",
  stagePreprocess: "\u9884\u5904\u7406",
  stageGrid: "\u7F51\u683C\u7C97\u7B5B",
  stageRank: "\u7EC4\u5185\u6392\u5E8F",
  stageScore: "\u5355\u5F20\u7CBE\u8BC4",
  pause: "\u6682\u505C",
  spent: "\u5DF2\u82B1\u8D39",
  checkpoint: "\u68C0\u67E5\u70B9",
  aiDisabled: "\u5F53\u524D\u6A21\u578B\u4E0D\u652F\u6301\u56FE\u7247\u8F93\u5165\uFF0CAI \u9636\u6BB5\u5DF2\u7981\u7528\u3002",
  review: "\u590D\u6838",
  filterAll: "\u5168\u90E8",
  filterKeep: "keep",
  filterMaybe: "maybe",
  filterReject: "reject",
  sortScore: "\u6309\u5206\u6570",
  sortTaken: "\u6309\u62CD\u6444\u65F6\u95F4",
  sortPath: "\u6309\u8DEF\u5F84",
  selectedCount: "\u5DF2\u9009",
  undoAction: "\u64A4\u9500",
  export: "\u5BFC\u51FA",
  exportTitle: "\u5BFC\u51FA\u7167\u7247",
  exportDest: "\u76EE\u6807\u76EE\u5F55",
  exportChoose: "\u9009\u62E9\u76EE\u5F55",
  exportBuckets: "\u5206\u6876",
  exportMode: "\u65B9\u5F0F",
  exportHardlink: "\u786C\u94FE\u63A5",
  exportCopy: "\u590D\u5236",
  exportPreview: "\u9884\u89C8\u6C47\u603B",
  exportRun: "\u6267\u884C\u5BFC\u51FA",
  exportResult: "\u5DF2\u5BFC\u51FA",
  exportConflict: "\u51B2\u7A81",
  exportSkipped: "\u5DF2\u5B58\u5728",
  exportSameVolume: "\u540C\u76D8\uFF0C\u53EF\u7528\u786C\u94FE\u63A5",
  exportCrossVolume: "\u8DE8\u76D8\uFF0C\u5C06\u56DE\u9000\u590D\u5236",
  manifest: "manifest",
  dimensionComposition: "\u6784\u56FE",
  dimensionLight: "\u5149\u5F71",
  dimensionColor: "\u8272\u5F69",
  dimensionTechnique: "\u6280\u672F",
  dimensionPostPotential: "\u540E\u671F\u6F5C\u529B",
  dimensionMoment: "\u77AC\u95F4",
  postProcessing: "\u540E\u671F\u5EFA\u8BAE",
  reason: "\u7406\u7531",
  scoreLabel: "\u5206\u6570",
  backToWall: "\u8FD4\u56DE\u56FE\u5899",
  keep: "\u4FDD\u7559 (P)",
  maybe: "\u5F85\u5B9A (M)",
  reject: "\u5F03\u7528 (X)",
  keyboardHint: "J/K \u524D\u540E \xB7 P \u4FDD\u7559 \xB7 M \u5F85\u5B9A \xB7 X \u5F03\u7528 \xB7 Space \u8FD4\u56DE"
};
var en = {
  title: "Photo Picker",
  subtitle: "Pick a local photo folder, scan it, then run local preprocess (dedupe / technical filters / grouping).",
  newProject: "New project",
  folder: "Photo folder",
  choose: "Choose with system dialog",
  browse: "Browse",
  name: "Project name",
  theme: "Theme",
  budget: "Budget (CNY)",
  create: "Create project",
  creating: "Creating\u2026",
  projectList: "Projects",
  projects: "Projects",
  back: "Back to projects",
  scan: "Scan",
  preprocess: "Preprocess",
  running: "Running",
  empty: "No projects yet. Pick a photo folder to create one.",
  noPhotos: "No thumbnails yet. Run Scan, then Preprocess.",
  loading: "Loading\u2026",
  themeMixed: "Mixed",
  themePortrait: "Portrait",
  themeLandscape: "Landscape",
  themeEvent: "Event",
  statusCreated: "New",
  statusScanned: "Scanned",
  statusPreprocessed: "Preprocessed",
  statusGridded: "Gridded",
  statusScored: "Scored",
  statusPaused: "Paused",
  statusFailed: "Failed",
  stageScan: "Scan",
  stagePreprocess: "Preprocess",
  stageGrid: "Grid triage",
  stageRank: "Rank group",
  stageScore: "Score photo",
  pause: "Pause",
  spent: "Spent",
  checkpoint: "Checkpoints",
  aiDisabled: "The current model does not accept image input, so AI stages are disabled.",
  review: "Review",
  filterAll: "All",
  filterKeep: "keep",
  filterMaybe: "maybe",
  filterReject: "reject",
  sortScore: "By score",
  sortTaken: "By time",
  sortPath: "By path",
  selectedCount: "Selected",
  undoAction: "Undo",
  export: "Export",
  exportTitle: "Export photos",
  exportDest: "Destination",
  exportChoose: "Choose folder",
  exportBuckets: "Buckets",
  exportMode: "Mode",
  exportHardlink: "Hardlink",
  exportCopy: "Copy",
  exportPreview: "Preview",
  exportRun: "Export",
  exportResult: "Exported",
  exportConflict: "Conflicts",
  exportSkipped: "Existing",
  exportSameVolume: "Same volume, hardlinks available",
  exportCrossVolume: "Cross volume, will fall back to copy",
  manifest: "manifest",
  dimensionComposition: "Composition",
  dimensionLight: "Light",
  dimensionColor: "Color",
  dimensionTechnique: "Technique",
  dimensionPostPotential: "Post",
  dimensionMoment: "Moment",
  postProcessing: "Suggestions",
  reason: "Reason",
  scoreLabel: "Score",
  backToWall: "Back to wall",
  keep: "Keep (P)",
  maybe: "Maybe (M)",
  reject: "Reject (X)",
  keyboardHint: "J/K prev/next \xB7 P keep \xB7 M maybe \xB7 X reject \xB7 Space back"
};
var btn = {
  background: "var(--dsw-alias-bg-layer-1)",
  color: "var(--dsw-alias-label-primary)",
  border: "1px solid var(--dsw-alias-border-l1)",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 13,
  lineHeight: 1.4,
  cursor: "pointer"
};
var btnPrimary = {
  ...btn,
  background: "var(--dsw-alias-button-primary-fill)",
  color: "var(--dsw-alias-label-primary-foreground)",
  border: "1px solid transparent"
};
var input = {
  background: "var(--dsw-alias-bg-layer-1)",
  color: "var(--dsw-alias-label-primary)",
  border: "1px solid var(--dsw-alias-border-l1)",
  borderRadius: 8,
  padding: "7px 10px",
  fontSize: 13,
  minWidth: 0
};
var muted = { color: "var(--dsw-alias-label-secondary)", fontSize: 12 };
var chip = {
  background: "var(--dsw-alias-bg-layer-2)",
  borderRadius: 6,
  padding: "2px 8px",
  fontSize: 12,
  color: "var(--dsw-alias-label-secondary)"
};
async function api(path, init) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...init
  });
  if (!response.ok) {
    const body = await response.json().catch(() => void 0);
    throw new Error(body?.error?.message ?? response.statusText);
  }
  return response.json();
}
function statusLabel(t, status) {
  if (status === "created") return t("statusCreated");
  if (status === "scanned") return t("statusScanned");
  if (status === "preprocessed") return t("statusPreprocessed");
  if (status === "gridded") return t("statusGridded");
  if (status === "scored") return t("statusScored");
  if (status === "paused") return t("statusPaused");
  if (status === "failed") return t("statusFailed");
  return status;
}
function stageLabel(t, stage) {
  const keys = {
    scan: "stageScan",
    preprocess: "stagePreprocess",
    grid: "stageGrid",
    rank: "stageRank",
    score: "stageScore"
  };
  return keys[stage] === void 0 ? stage : t(keys[stage]);
}
function summarizeStats(stats) {
  if (stats === null || stats === void 0) return "";
  const parts = [];
  for (const key of ["photos", "selected", "rejected", "failed", "groups", "kept", "scored", "done", "errors"]) {
    if (typeof stats[key] === "number") parts.push(`${key} ${stats[key]}`);
  }
  if (typeof stats.durationMs === "number") parts.push(`${Math.round(stats.durationMs / 1e3)}s`);
  return parts.join(" \xB7 ");
}
function CreateForm({ t, onCreated, onCancel }) {
  const [folder, setFolder] = (0, import_react.useState)("");
  const [dirs, setDirs] = (0, import_react.useState)([]);
  const [name, setName] = (0, import_react.useState)("");
  const [theme, setTheme] = (0, import_react.useState)("mixed");
  const [budget, setBudget] = (0, import_react.useState)("30");
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const browse = async (path) => {
    try {
      setDirs(await api(`/photo-picker/api/fs/list?path=${encodeURIComponent(path)}`));
      setFolder(path);
      setError(null);
    } catch (cause) {
      setError(String(cause));
    }
  };
  const choose = async () => {
    try {
      const result = await api("/photo-picker/api/fs/choose", { method: "POST" });
      setFolder(result.path);
      setError(null);
    } catch (cause) {
      setError(String(cause));
    }
  };
  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const project = await api("/photo-picker/api/projects", {
        method: "POST",
        body: JSON.stringify({
          source: { kind: "local", path: folder },
          name: name === "" ? void 0 : name,
          theme,
          budgetCny: Number(budget) || 30
        })
      });
      onCreated(project.id);
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ h("div", { style: { display: "grid", gap: 14, maxWidth: 640, border: "1px solid var(--dsw-alias-border-l1)", background: "var(--dsw-alias-bg-layer-1)", borderRadius: 12, padding: 16 } }, /* @__PURE__ */ h("label", { style: { display: "grid", gap: 6 } }, /* @__PURE__ */ h("span", { style: muted }, t("folder")), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ h(
    "input",
    {
      value: folder,
      onChange: (event) => setFolder(event.target.value),
      placeholder: "/Users/\u2026/Pictures",
      style: { ...input, flex: 1 }
    }
  ), /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: choose }, t("choose")), /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => browse(folder) }, t("browse")))), dirs.length > 0 && /* @__PURE__ */ h("div", { style: { maxHeight: 200, overflow: "auto", border: "1px solid var(--dsw-alias-border-l1)", borderRadius: 8 } }, dirs.map((dir) => /* @__PURE__ */ h(
    "div",
    {
      key: dir.path,
      onClick: () => browse(dir.path),
      style: { padding: "6px 10px", cursor: "pointer", fontSize: 13 }
    },
    dir.name
  ))), /* @__PURE__ */ h("label", { style: { display: "grid", gap: 6 } }, /* @__PURE__ */ h("span", { style: muted }, t("name")), /* @__PURE__ */ h("input", { value: name, onChange: (event) => setName(event.target.value), placeholder: "2024 \u5A5A\u793C", style: input })), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 14 } }, /* @__PURE__ */ h("label", { style: { display: "grid", gap: 6 } }, /* @__PURE__ */ h("span", { style: muted }, t("theme")), /* @__PURE__ */ h("select", { value: theme, onChange: (event) => setTheme(event.target.value), style: input }, /* @__PURE__ */ h("option", { value: "mixed" }, t("themeMixed")), /* @__PURE__ */ h("option", { value: "portrait" }, t("themePortrait")), /* @__PURE__ */ h("option", { value: "landscape" }, t("themeLandscape")), /* @__PURE__ */ h("option", { value: "event" }, t("themeEvent")))), /* @__PURE__ */ h("label", { style: { display: "grid", gap: 6 } }, /* @__PURE__ */ h("span", { style: muted }, t("budget")), /* @__PURE__ */ h("input", { value: budget, onChange: (event) => setBudget(event.target.value), style: { ...input, width: 100 } }))), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ h("button", { type: "button", style: btnPrimary, disabled: busy || folder === "", onClick: create }, busy ? t("creating") : t("create")), /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: onCancel }, t("back"))), error !== null && /* @__PURE__ */ h("div", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)", fontSize: 12 } }, error));
}
var VERDICT_COLORS = {
  keep: "var(--dsw-static-green-500, #2f9e5f)",
  maybe: "var(--dsw-static-amber-500, #d09a2b)",
  reject: "var(--dsw-static-red-500, #cc4b3f)"
};
var DIMENSION_LABELS = {
  composition: "dimensionComposition",
  light: "dimensionLight",
  color: "dimensionColor",
  technique: "dimensionTechnique",
  post_potential: "dimensionPostPotential",
  moment: "dimensionMoment"
};
function ReviewSection({ t, projectId, version, onChanged }) {
  const [items, setItems] = (0, import_react.useState)([]);
  const [filter, setFilter] = (0, import_react.useState)("all");
  const [sort, setSort] = (0, import_react.useState)("score");
  const [selected, setSelected] = (0, import_react.useState)([]);
  const [undo, setUndo] = (0, import_react.useState)([]);
  const [single, setSingle] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)(null);
  const load = async () => {
    const params = new URLSearchParams({ scope: "review", sort, limit: "200" });
    if (filter !== "all") params.set("verdict", filter);
    const data = await api(`/photo-picker/api/projects/${projectId}/photos?${params.toString()}`);
    setItems(data.items);
    setSelected((current) => current.filter((id) => data.items.some((item) => item.id === id)));
  };
  (0, import_react.useEffect)(() => {
    load().catch((cause) => setError(String(cause)));
  }, [filter, sort, version]);
  const decide = async (photoIds, verdict) => {
    if (photoIds.length === 0) return;
    const previous = {};
    for (const item of items) if (photoIds.includes(item.id)) previous[item.id] = item.humanVerdict;
    try {
      await api(`/photo-picker/api/projects/${projectId}/decisions`, {
        method: "POST",
        body: JSON.stringify({ photoIds, verdict })
      });
      setUndo((stack) => [{ previous }, ...stack].slice(0, 20));
      setSelected([]);
      await load();
      onChanged?.();
    } catch (cause) {
      setError(String(cause));
    }
  };
  const undoLast = async () => {
    const entry = undo[0];
    if (entry === void 0) return;
    const groups = {};
    for (const [photoId, verdict] of Object.entries(entry.previous)) {
      const key = verdict ?? "auto";
      groups[key] = [...groups[key] ?? [], photoId];
    }
    try {
      for (const [verdict, photoIds] of Object.entries(groups)) {
        await api(`/photo-picker/api/projects/${projectId}/decisions`, {
          method: "POST",
          body: JSON.stringify({ photoIds, verdict })
        });
      }
      setUndo((stack) => stack.slice(1));
      await load();
      onChanged?.();
    } catch (cause) {
      setError(String(cause));
    }
  };
  const toggle = (photoId) => setSelected((current) => current.includes(photoId) ? current.filter((id) => id !== photoId) : [...current, photoId]);
  if (single !== null) {
    return /* @__PURE__ */ h(
      PhotoSingle,
      {
        t,
        projectId,
        items,
        photoId: single,
        version,
        onNavigate: setSingle,
        onDecide: decide,
        onClose: () => setSingle(null)
      }
    );
  }
  const filters = [
    ["all", t("filterAll")],
    ["keep", t("filterKeep")],
    ["maybe", t("filterMaybe")],
    ["reject", t("filterReject")]
  ];
  return /* @__PURE__ */ h("div", { style: { display: "grid", gap: 10 } }, /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ h("span", { style: { ...muted, fontWeight: 600 } }, t("review")), filters.map(([value, label]) => /* @__PURE__ */ h(
    "button",
    {
      key: value,
      type: "button",
      onClick: () => setFilter(value),
      style: {
        ...chip,
        cursor: "pointer",
        border: "1px solid transparent",
        background: filter === value ? "var(--dsw-alias-brand-primary)" : "var(--dsw-alias-bg-layer-2)",
        color: filter === value ? "var(--dsw-alias-label-primary-foreground)" : "var(--dsw-alias-label-secondary)"
      }
    },
    label
  )), /* @__PURE__ */ h("select", { value: sort, onChange: (event) => setSort(event.target.value), style: { ...input, padding: "4px 8px", fontSize: 12 } }, /* @__PURE__ */ h("option", { value: "score" }, t("sortScore")), /* @__PURE__ */ h("option", { value: "taken_at" }, t("sortTaken")), /* @__PURE__ */ h("option", { value: "rel_path" }, t("sortPath"))), /* @__PURE__ */ h("span", { style: { ...muted, marginLeft: "auto" } }, items.length, " / ", t("photos"))), /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ h("span", { style: muted }, t("selectedCount"), ": ", selected.length), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: selected.length === 0, onClick: () => decide(selected, "keep") }, t("keep")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: selected.length === 0, onClick: () => decide(selected, "maybe") }, t("maybe")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: selected.length === 0, onClick: () => decide(selected, "reject") }, t("reject")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: undo.length === 0, onClick: undoLast }, t("undoAction"))), error !== null && /* @__PURE__ */ h("div", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)", fontSize: 12 } }, error), items.length === 0 ? /* @__PURE__ */ h("div", { style: { ...muted, fontSize: 13 } }, t("noPhotos")) : /* @__PURE__ */ h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))", gap: 8 } }, items.map((item) => /* @__PURE__ */ h("div", { key: item.id, style: { position: "relative" } }, /* @__PURE__ */ h(
    "button",
    {
      type: "button",
      title: item.relPath,
      onClick: () => setSingle(item.id),
      style: {
        display: "block",
        width: "100%",
        aspectRatio: "1",
        padding: 0,
        border: "1px solid var(--dsw-alias-border-l1)",
        borderRadius: 8,
        overflow: "hidden",
        background: "var(--dsw-alias-bg-layer-2)",
        cursor: "pointer",
        position: "relative"
      }
    },
    /* @__PURE__ */ h("img", { src: `${item.thumbUrl}?v=${version}`, alt: item.relPath, style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } }),
    /* @__PURE__ */ h("span", { style: { position: "absolute", left: 0, right: 0, bottom: 0, height: 4, background: VERDICT_COLORS[item.verdict] ?? "var(--dsw-alias-border-l2)" } }),
    item.score !== null && /* @__PURE__ */ h("span", { style: { position: "absolute", top: 6, left: 6, padding: "1px 6px", borderRadius: 6, background: "rgba(0,0,0,0.62)", color: "#fff", fontSize: 11 } }, Number(item.score).toFixed(1)),
    item.humanVerdict !== null && /* @__PURE__ */ h("span", { style: { position: "absolute", bottom: 8, right: 6, padding: "1px 5px", borderRadius: 5, background: "rgba(0,0,0,0.62)", color: "#fff", fontSize: 10 } }, item.humanVerdict)
  ), /* @__PURE__ */ h(
    "input",
    {
      type: "checkbox",
      checked: selected.includes(item.id),
      onChange: () => toggle(item.id),
      style: { position: "absolute", top: 8, right: 8, width: 16, height: 16, cursor: "pointer" }
    }
  )))));
}
function PhotoSingle({ t, projectId, items, photoId, version, onNavigate, onDecide, onClose }) {
  const [detail, setDetail] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    setDetail(null);
    api(`/photo-picker/api/projects/${projectId}/photos/${photoId}`).then(setDetail).catch((cause) => setError(String(cause)));
  }, [photoId]);
  const index = items.findIndex((item) => item.id === photoId);
  const move = (delta) => {
    const next = items[index + delta];
    if (next !== void 0) onNavigate(next.id);
  };
  (0, import_react.useEffect)(() => {
    const onKey = (event) => {
      const target = event.target;
      if (target !== null && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "j" || event.key === "ArrowRight") move(1);
      else if (event.key === "k" || event.key === "ArrowLeft") move(-1);
      else if (event.key === "p") onDecide([photoId], "keep");
      else if (event.key === "m") onDecide([photoId], "maybe");
      else if (event.key === "x") onDecide([photoId], "reject");
      else if (event.key === " " || event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photoId, index, items]);
  if (error !== null) return /* @__PURE__ */ h("div", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)", fontSize: 12 } }, error);
  if (detail === null) return /* @__PURE__ */ h("div", { style: { ...muted, fontSize: 13 } }, t("loading"));
  const dimensions = detail.dimensions ?? {};
  return /* @__PURE__ */ h("div", { style: { display: "grid", gap: 10 } }, /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: onClose }, t("backToWall")), /* @__PURE__ */ h("span", { style: muted }, index + 1, " / ", items.length), /* @__PURE__ */ h("span", { style: { ...chip, background: VERDICT_COLORS[detail.verdict] ?? "var(--dsw-alias-bg-layer-2)", color: "#fff" } }, detail.verdict), detail.score !== null && /* @__PURE__ */ h("span", { style: chip }, t("scoreLabel"), ": ", detail.score), /* @__PURE__ */ h("span", { style: { ...muted, marginLeft: "auto" } }, detail.relPath)), /* @__PURE__ */ h("div", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: 14, alignItems: "start" } }, /* @__PURE__ */ h(
    "img",
    {
      src: `${detail.previewUrl}?v=${version}`,
      alt: detail.relPath,
      style: { width: "100%", maxHeight: "72vh", objectFit: "contain", borderRadius: 10, background: "var(--dsw-alias-bg-layer-2)" }
    }
  ), /* @__PURE__ */ h("div", { style: { display: "grid", gap: 10 } }, /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => onDecide([photoId], "keep") }, t("keep")), /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => onDecide([photoId], "maybe") }, t("maybe")), /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => onDecide([photoId], "reject") }, t("reject"))), /* @__PURE__ */ h("div", { style: { ...muted, fontSize: 12 } }, t("keyboardHint")), /* @__PURE__ */ h("div", { style: { display: "grid", gap: 6 } }, Object.keys(DIMENSION_LABELS).map((key) => {
    const value = dimensions[key];
    return /* @__PURE__ */ h("div", { key, style: { display: "grid", gridTemplateColumns: "64px 1fr 28px", gap: 8, alignItems: "center", fontSize: 12 } }, /* @__PURE__ */ h("span", { style: muted }, t(DIMENSION_LABELS[key])), /* @__PURE__ */ h("div", { style: { height: 6, borderRadius: 3, background: "var(--dsw-alias-bg-layer-2)", overflow: "hidden" } }, /* @__PURE__ */ h("div", { style: { height: "100%", width: `${Math.max(0, Math.min(10, value ?? 0)) * 10}%`, background: "var(--dsw-alias-brand-primary)" } })), /* @__PURE__ */ h("span", null, value === null || value === void 0 ? "\u2014" : value));
  })), detail.reason !== null && /* @__PURE__ */ h("div", { style: { display: "grid", gap: 4 } }, /* @__PURE__ */ h("span", { style: { ...muted, fontWeight: 600 } }, t("reason")), /* @__PURE__ */ h("span", { style: { fontSize: 13 } }, detail.reason)), (detail.postProcessing ?? []).length > 0 && /* @__PURE__ */ h("div", { style: { display: "grid", gap: 4 } }, /* @__PURE__ */ h("span", { style: { ...muted, fontWeight: 600 } }, t("postProcessing")), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, detail.postProcessing.map((code) => /* @__PURE__ */ h("span", { key: code, style: chip }, code)))), /* @__PURE__ */ h("div", { style: muted }, detail.width, " \xD7 ", detail.height, detail.group !== void 0 ? ` \xB7 \u7EC4\u5185\u7B2C ${detail.group.rank}/${detail.group.size}` : ""))));
}
function ExportDialog({ t, projectId, onClose }) {
  const [dest, setDest] = (0, import_react.useState)("");
  const [buckets, setBuckets] = (0, import_react.useState)(["keep", "maybe"]);
  const [mode, setMode] = (0, import_react.useState)("hardlink");
  const [preview, setPreview] = (0, import_react.useState)(null);
  const [result, setResult] = (0, import_react.useState)(null);
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const toggleBucket = (bucket) => setBuckets((current) => current.includes(bucket) ? current.filter((item) => item !== bucket) : [...current, bucket]);
  const choose = async () => {
    try {
      const picked = await api("/photo-picker/api/fs/choose", { method: "POST" });
      setDest(picked.path);
    } catch (cause) {
      setError(String(cause));
    }
  };
  const execute = async (action) => {
    setBusy(true);
    setError(null);
    try {
      const data = await api(`/photo-picker/api/projects/${projectId}/export/${action}`, {
        method: "POST",
        body: JSON.stringify({ dest, buckets, mode })
      });
      if (action === "preview") setPreview(data);
      else {
        setResult(data);
        setPreview(null);
      }
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ h("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.42)", zIndex: 70, display: "grid", placeItems: "center" } }, /* @__PURE__ */ h("div", { style: {
    width: "min(620px, 92vw)",
    maxHeight: "86vh",
    overflow: "auto",
    background: "var(--dsw-alias-bg-overlay)",
    color: "var(--dsw-alias-label-primary)",
    border: "1px solid var(--dsw-alias-border-l1)",
    borderRadius: 14,
    padding: 18,
    display: "grid",
    gap: 12
  } }, /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center" } }, /* @__PURE__ */ h("strong", null, t("exportTitle")), /* @__PURE__ */ h("button", { type: "button", style: { ...btn, marginLeft: "auto" }, onClick: onClose }, t("close"))), /* @__PURE__ */ h("label", { style: { display: "grid", gap: 6 } }, /* @__PURE__ */ h("span", { style: muted }, t("exportDest")), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ h(
    "input",
    {
      value: dest,
      onChange: (event) => setDest(event.target.value),
      placeholder: "/Volumes/\u2026/\u7CBE\u9009",
      style: { ...input, flex: 1 }
    }
  ), /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: choose }, t("exportChoose")))), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ h("span", { style: muted }, t("exportBuckets")), ["keep", "maybe", "reject"].map((bucket) => /* @__PURE__ */ h("label", { key: bucket, style: { display: "flex", gap: 4, alignItems: "center", fontSize: 13 } }, /* @__PURE__ */ h("input", { type: "checkbox", checked: buckets.includes(bucket), onChange: () => toggleBucket(bucket) }), bucket)), /* @__PURE__ */ h("span", { style: { ...muted, marginLeft: 8 } }, t("exportMode")), /* @__PURE__ */ h("select", { value: mode, onChange: (event) => setMode(event.target.value), style: { ...input, padding: "4px 8px", fontSize: 12 } }, /* @__PURE__ */ h("option", { value: "hardlink" }, t("exportHardlink")), /* @__PURE__ */ h("option", { value: "copy" }, t("exportCopy")))), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: busy || dest === "", onClick: () => execute("preview") }, t("exportPreview")), /* @__PURE__ */ h("button", { type: "button", style: btnPrimary, disabled: busy || dest === "" || preview === null, onClick: () => execute("run") }, t("exportRun"))), error !== null && /* @__PURE__ */ h("div", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)", fontSize: 12 } }, error), preview !== null && /* @__PURE__ */ h("div", { style: { display: "grid", gap: 4, fontSize: 13 } }, /* @__PURE__ */ h("span", null, Object.entries(preview.counts).map(([bucket, count]) => `${bucket} ${count}`).join(" \xB7 "), " \xB7 ", (preview.totalBytes / 1024 / 1024).toFixed(1), " MB"), /* @__PURE__ */ h("span", { style: muted }, t("exportSkipped"), " ", preview.skippedExisting, " \xB7 ", t("exportConflict"), " ", preview.conflictCount, " \xB7 ", preview.sameVolume ? t("exportSameVolume") : t("exportCrossVolume"))), result !== null && /* @__PURE__ */ h("div", { style: { display: "grid", gap: 4, fontSize: 13 } }, /* @__PURE__ */ h("span", null, t("exportResult"), ": ", Object.entries(result.counts).map(([bucket, count]) => `${bucket} ${count}`).join(" \xB7 ")), /* @__PURE__ */ h("span", { style: muted }, t("manifest"), ": ", result.manifestPath), result.failureCount > 0 && /* @__PURE__ */ h("span", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)" } }, t("exportConflict"), ": ", result.failureCount))));
}
function ProjectDetail({ t, id }) {
  const [detail, setDetail] = (0, import_react.useState)(null);
  const [progress, setProgress] = (0, import_react.useState)(null);
  const [checkpoints, setCheckpoints] = (0, import_react.useState)([]);
  const [exporting, setExporting] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const refresh = async () => {
    try {
      const [project, points] = await Promise.all([
        api(`/photo-picker/api/projects/${id}`),
        api(`/photo-picker/api/projects/${id}/checkpoints`)
      ]);
      setDetail(project);
      setCheckpoints(points);
      setError(null);
    } catch (cause) {
      setError(String(cause));
    }
  };
  (0, import_react.useEffect)(() => {
    refresh();
    const events = new EventSource(`/photo-picker/api/projects/${id}/events`);
    events.onmessage = (message) => {
      const event = JSON.parse(message.data);
      setProgress(event);
      if (event.done === true) refresh();
    };
    return () => events.close();
  }, [id]);
  const run = async (stage, action = "start") => {
    try {
      await api(`/photo-picker/api/projects/${id}/actions`, {
        method: "POST",
        body: JSON.stringify({ stage, action })
      });
    } catch (cause) {
      setError(String(cause));
    }
  };
  if (detail === null) return /* @__PURE__ */ h("div", { style: { ...muted, fontSize: 13 } }, t("loading"));
  const counts = detail.counts ?? {};
  const version = detail.updatedAt ?? 0;
  const aiDisabled = detail.ai?.hasImageModel === false;
  const percent = progress?.total ? Math.min(100, Math.round((progress.done ?? 0) / progress.total * 100)) : 0;
  return /* @__PURE__ */ h("div", { style: { display: "grid", gap: 16 } }, /* @__PURE__ */ h("div", { style: { display: "grid", gap: 6 } }, /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ h("strong", { style: { fontSize: 16 } }, detail.name), /* @__PURE__ */ h("span", { style: chip }, statusLabel(t, detail.status)), /* @__PURE__ */ h("span", { style: muted }, detail.sourcePath)), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, Object.entries(counts).map(([state, count]) => /* @__PURE__ */ h("span", { key: state, style: chip }, state, ": ", String(count))), /* @__PURE__ */ h("span", { style: chip }, t("spent"), ": \xA5", Number(detail.cost?.spentCny ?? 0).toFixed(4), " / \xA5", Number(detail.cost?.budgetCny ?? 0).toFixed(0)), detail.running !== null && /* @__PURE__ */ h("span", { style: { ...chip, color: "var(--dsw-alias-brand-primary)" } }, t("running"), ": ", detail.running))), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => run("scan") }, t("scan")), /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => run("preprocess") }, t("preprocess")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: aiDisabled, onClick: () => run("grid") }, t("stageGrid")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: aiDisabled, onClick: () => run("rank") }, t("stageRank")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: aiDisabled, onClick: () => run("score") }, t("stageScore")), detail.running !== null && /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => run(detail.running, "pause") }, t("pause")), /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => setExporting(true) }, t("export"))), exporting && /* @__PURE__ */ h(ExportDialog, { t, projectId: id, onClose: () => setExporting(false) }), aiDisabled && /* @__PURE__ */ h("div", { style: muted }, t("aiDisabled")), progress !== null && /* @__PURE__ */ h("div", { style: { display: "grid", gap: 4 } }, /* @__PURE__ */ h("div", { style: muted }, stageLabel(t, progress.stage), " ", progress.done ?? 0, "/", progress.total ?? "?", progress.costCny !== void 0 ? ` \xB7 \xA5${Number(progress.costCny).toFixed(4)}` : "", progress.error !== void 0 && progress.error !== null ? ` \xB7 ${String(progress.error)}` : ""), /* @__PURE__ */ h("div", { style: { height: 4, borderRadius: 2, background: "var(--dsw-alias-bg-layer-2)", overflow: "hidden" } }, /* @__PURE__ */ h("div", { style: { height: "100%", width: `${percent}%`, background: "var(--dsw-alias-brand-primary)" } }))), error !== null && /* @__PURE__ */ h("div", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)", fontSize: 12 } }, error), checkpoints.length > 0 && /* @__PURE__ */ h("div", { style: { display: "grid", gap: 8 } }, /* @__PURE__ */ h("span", { style: { ...muted, fontWeight: 600 } }, t("checkpoint")), checkpoints.map((cp) => /* @__PURE__ */ h("div", { key: cp.stage, style: {
    border: "1px solid var(--dsw-alias-border-l1)",
    borderRadius: 10,
    padding: 12,
    display: "grid",
    gap: 8
  } }, /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ h("strong", null, stageLabel(t, cp.stage)), /* @__PURE__ */ h("span", { style: chip }, cp.status), /* @__PURE__ */ h("span", { style: chip }, "\xA5", Number(cp.costCny ?? 0).toFixed(4)), /* @__PURE__ */ h("span", { style: { ...muted, marginLeft: "auto" } }, summarizeStats(cp.stats))), (cp.sampleIds ?? []).length > 0 && /* @__PURE__ */ h("div", { style: { display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6 } }, cp.sampleIds.map((pid) => /* @__PURE__ */ h(
    "img",
    {
      key: pid,
      src: `/photo-picker/media/thumb/${id}/${pid}?v=${version}`,
      alt: pid,
      style: { width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 6, background: "var(--dsw-alias-bg-layer-2)" }
    }
  )))))), /* @__PURE__ */ h(ReviewSection, { t, projectId: id, version, onChanged: refresh }));
}
function Workbench({ t }) {
  const [projects, setProjects] = (0, import_react.useState)(null);
  const [selected, setSelected] = (0, import_react.useState)(null);
  const [creating, setCreating] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const reload = async () => {
    try {
      setProjects(await api("/photo-picker/api/projects"));
      setError(null);
    } catch (cause) {
      setProjects([]);
      setError(String(cause));
    }
  };
  (0, import_react.useEffect)(() => {
    reload();
  }, []);
  const list = projects ?? [];
  return /* @__PURE__ */ h("div", { style: {
    width: "100%",
    height: "100%",
    overflow: "auto",
    background: "var(--dsw-alias-bg-base)",
    color: "var(--dsw-alias-label-primary)",
    fontSize: 14,
    lineHeight: 1.6
  } }, /* @__PURE__ */ h("div", { style: { maxWidth: 960, margin: "0 auto", padding: "0 clamp(24px, 4vw, 48px) 48px" } }, /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center", gap: 12, paddingTop: 28, marginBottom: 24 } }, /* @__PURE__ */ h("div", { style: { display: "grid", gap: 2 } }, /* @__PURE__ */ h("h1", { style: { margin: 0, fontSize: 20, fontWeight: 600 } }, t("title")), /* @__PURE__ */ h("span", { style: muted }, t("subtitle"))), /* @__PURE__ */ h("div", { style: { marginLeft: "auto", display: "flex", gap: 8 } }, selected !== null && /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => setSelected(null) }, t("back")), /* @__PURE__ */ h("button", { type: "button", style: selected !== null ? btn : btnPrimary, onClick: () => {
    setCreating(true);
    setSelected(null);
  } }, t("newProject")))), error !== null && /* @__PURE__ */ h("div", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)", fontSize: 12, marginBottom: 12 } }, error), selected !== null ? /* @__PURE__ */ h(ProjectDetail, { t, id: selected }) : creating ? /* @__PURE__ */ h(
    CreateForm,
    {
      t,
      onCreated: (id) => {
        setCreating(false);
        setSelected(id);
        void reload();
      },
      onCancel: () => setCreating(false)
    }
  ) : projects === null ? /* @__PURE__ */ h("div", { style: { ...muted, fontSize: 13 } }, t("loading")) : list.length === 0 ? /* @__PURE__ */ h("div", { style: {
    display: "grid",
    gap: 12,
    placeItems: "start",
    border: "1px dashed var(--dsw-alias-border-l2)",
    borderRadius: 12,
    padding: 24,
    color: "var(--dsw-alias-label-secondary)",
    fontSize: 13
  } }, /* @__PURE__ */ h("span", null, t("empty")), /* @__PURE__ */ h("button", { type: "button", style: btnPrimary, onClick: () => setCreating(true) }, t("newProject"))) : /* @__PURE__ */ h("div", { style: { display: "grid", gap: 8 } }, list.map((project) => /* @__PURE__ */ h(
    "button",
    {
      type: "button",
      key: project.id,
      onClick: () => setSelected(project.id),
      style: {
        ...btn,
        textAlign: "left",
        display: "grid",
        gap: 4,
        padding: "12px 14px",
        borderRadius: 10
      }
    },
    /* @__PURE__ */ h("span", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ h("strong", { style: { fontSize: 14 } }, project.name), /* @__PURE__ */ h("span", { style: chip }, statusLabel(t, project.status))),
    /* @__PURE__ */ h("span", { style: muted }, project.sourcePath, " \xB7 ", Object.entries(project.counts ?? {}).map(([state, n]) => `${state} ${String(n)}`).join("  "))
  )))));
}
function PhotoPickerIcon({ size }) {
  const edge = size ?? 16;
  return /* @__PURE__ */ h("svg", { width: edge, height: edge, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", style: { display: "block" } }, /* @__PURE__ */ h("circle", { cx: "12", cy: "12", r: "8.4", stroke: "currentColor", strokeWidth: "1.6" }), /* @__PURE__ */ h("path", { d: "M12 3.9 16.15 8.3l-1.55 5.25h-5.2L7.85 8.3 12 3.9Z", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" }), /* @__PURE__ */ h("circle", { cx: "12", cy: "12", r: "2.6", stroke: "currentColor", strokeWidth: "1.4" }));
}
var inject = ["slots", "locale"];
function apply(ctx) {
  const t = ctx.locale.bind(NS);
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "photo-picker.locale");
  ctx.slots.inject("main", () => ctx.slots.register(
    { name: "main", key: PANEL_ID, locale: NS },
    Workbench
  ));
  ctx.slots.inject("sidebar.panellist", () => ctx.slots.register(
    { name: "sidebar.panellist", id: PANEL_ID, order: 20, locale: NS, label: () => t("title") },
    PhotoPickerIcon
  ));
}

    return module.exports;
  },
});
