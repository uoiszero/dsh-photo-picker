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
  statusPreprocessed: "\u5DF2\u9884\u5904\u7406"
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
  statusPreprocessed: "Preprocessed"
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
  return status;
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
function ProjectDetail({ t, id }) {
  const [detail, setDetail] = (0, import_react.useState)(null);
  const [photos, setPhotos] = (0, import_react.useState)([]);
  const [progress, setProgress] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)(null);
  const refresh = async () => {
    try {
      setDetail(await api(`/photo-picker/api/projects/${id}`));
      setPhotos(await api(`/photo-picker/api/projects/${id}/photos?limit=120`));
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
  const run = async (stage) => {
    try {
      await api(`/photo-picker/api/projects/${id}/actions`, {
        method: "POST",
        body: JSON.stringify({ stage })
      });
    } catch (cause) {
      setError(String(cause));
    }
  };
  if (detail === null) return /* @__PURE__ */ h("div", { style: { ...muted, fontSize: 13 } }, t("loading"));
  const counts = detail.counts ?? {};
  const version = detail.updatedAt ?? 0;
  return /* @__PURE__ */ h("div", { style: { display: "grid", gap: 16 } }, /* @__PURE__ */ h("div", { style: { display: "grid", gap: 6 } }, /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ h("strong", { style: { fontSize: 16 } }, detail.name), /* @__PURE__ */ h("span", { style: chip }, statusLabel(t, detail.status)), /* @__PURE__ */ h("span", { style: muted }, detail.sourcePath)), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, Object.entries(counts).map(([state, count]) => /* @__PURE__ */ h("span", { key: state, style: chip }, state, ": ", String(count))), detail.running !== null && /* @__PURE__ */ h("span", { style: { ...chip, color: "var(--dsw-alias-brand-primary)" } }, t("running"), ": ", detail.running))), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => run("scan") }, t("scan")), /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => run("preprocess") }, t("preprocess"))), progress !== null && /* @__PURE__ */ h("div", { style: muted }, progress.stage, " ", progress.done ?? 0, "/", progress.total ?? "?", " ", progress.error ?? ""), error !== null && /* @__PURE__ */ h("div", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)", fontSize: 12 } }, error), photos.length === 0 ? /* @__PURE__ */ h("div", { style: { ...muted, fontSize: 13 } }, t("noPhotos")) : /* @__PURE__ */ h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 8 } }, photos.map((photo) => photo.hasThumb ? /* @__PURE__ */ h(
    "img",
    {
      key: photo.id,
      src: `${photo.thumbUrl}?v=${version}`,
      alt: photo.relPath,
      title: photo.relPath,
      style: { width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, background: "var(--dsw-alias-bg-layer-2)" }
    }
  ) : /* @__PURE__ */ h(
    "div",
    {
      key: photo.id,
      title: photo.relPath,
      style: {
        aspectRatio: "1",
        borderRadius: 8,
        background: "var(--dsw-alias-bg-layer-2)",
        border: "1px dashed var(--dsw-alias-border-l1)",
        display: "grid",
        placeItems: "center",
        padding: 6,
        fontSize: 11,
        color: "var(--dsw-alias-label-tertiary)",
        textAlign: "center",
        overflowWrap: "anywhere"
      }
    },
    photo.state
  ))));
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
