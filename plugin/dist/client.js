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
var zh = {
  open: "\u7167\u7247\u5DE5\u4F5C\u53F0",
  title: "\u7167\u7247\u5DE5\u4F5C\u53F0",
  close: "\u5173\u95ED",
  newProject: "\u65B0\u5EFA\u9879\u76EE",
  folder: "\u7167\u7247\u6587\u4EF6\u5939",
  choose: "\u7528\u7CFB\u7EDF\u5BF9\u8BDD\u6846\u9009\u62E9",
  browse: "\u6D4F\u89C8",
  up: "\u4E0A\u4E00\u7EA7",
  name: "\u9879\u76EE\u540D",
  theme: "\u9898\u6750",
  budget: "\u9884\u7B97\uFF08\u5143\uFF09",
  create: "\u521B\u5EFA\u9879\u76EE",
  creating: "\u521B\u5EFA\u4E2D\u2026",
  projects: "\u9879\u76EE",
  scan: "\u5F00\u59CB\u626B\u63CF",
  preprocess: "\u5F00\u59CB\u9884\u5904\u7406",
  photos: "\u7167\u7247",
  running: "\u8FD0\u884C\u4E2D",
  empty: "\u8FD8\u6CA1\u6709\u9879\u76EE\uFF0C\u5148\u9009\u62E9\u7167\u7247\u6587\u4EF6\u5939\u3002",
  error: "\u51FA\u9519",
  loading: "\u52A0\u8F7D\u4E2D\u2026"
};
var en = {
  open: "Photo Picker",
  title: "Photo Picker",
  close: "Close",
  newProject: "New project",
  folder: "Photo folder",
  choose: "Choose with system dialog",
  browse: "Browse",
  up: "Up",
  name: "Project name",
  theme: "Theme",
  budget: "Budget (CNY)",
  create: "Create project",
  creating: "Creating\u2026",
  projects: "Projects",
  scan: "Scan",
  preprocess: "Preprocess",
  photos: "Photos",
  running: "Running",
  empty: "No projects yet. Pick a photo folder first.",
  error: "Error",
  loading: "Loading\u2026"
};
var open = false;
var listeners = /* @__PURE__ */ new Set();
function setOpen(value) {
  open = value;
  for (const listener of listeners) listener();
}
function useOpen() {
  return (0, import_react.useSyncExternalStore)(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => open
  );
}
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
function Launcher({ t }) {
  return /* @__PURE__ */ h(
    "button",
    {
      type: "button",
      onClick: () => setOpen(true),
      style: {
        border: "1px solid #3a4050",
        borderRadius: 8,
        background: "#1a1f2a",
        color: "#e8eaf0",
        padding: "4px 10px",
        fontSize: 12,
        cursor: "pointer"
      }
    },
    t("open")
  );
}
function CreateForm({ t, onCreated }) {
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
  return /* @__PURE__ */ h("div", { style: { display: "grid", gap: 10 } }, /* @__PURE__ */ h("label", { style: { display: "grid", gap: 4 } }, /* @__PURE__ */ h("span", { style: { fontSize: 12, color: "#9aa3b5" } }, t("folder")), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ h(
    "input",
    {
      value: folder,
      onChange: (event) => setFolder(event.target.value),
      placeholder: "/Users/\u2026/Pictures",
      style: { flex: 1, background: "#11151d", border: "1px solid #3a4050", color: "#e8eaf0", borderRadius: 6, padding: "6px 8px" }
    }
  ), /* @__PURE__ */ h("button", { type: "button", onClick: choose }, t("choose")), /* @__PURE__ */ h("button", { type: "button", onClick: () => browse(folder) }, t("browse")))), dirs.length > 0 && /* @__PURE__ */ h("div", { style: { maxHeight: 160, overflow: "auto", border: "1px solid #2a2f3a", borderRadius: 6 } }, dirs.map((dir) => /* @__PURE__ */ h(
    "div",
    {
      key: dir.path,
      onClick: () => browse(dir.path),
      style: { padding: "4px 8px", cursor: "pointer", fontSize: 12 }
    },
    dir.name
  ))), /* @__PURE__ */ h("label", { style: { display: "grid", gap: 4 } }, /* @__PURE__ */ h("span", { style: { fontSize: 12, color: "#9aa3b5" } }, t("name")), /* @__PURE__ */ h("input", { value: name, onChange: (event) => setName(event.target.value), placeholder: "2024 \u5A5A\u793C", style: { background: "#11151d", border: "1px solid #3a4050", color: "#e8eaf0", borderRadius: 6, padding: "6px 8px" } })), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ h("label", { style: { display: "grid", gap: 4 } }, /* @__PURE__ */ h("span", { style: { fontSize: 12, color: "#9aa3b5" } }, t("theme")), /* @__PURE__ */ h("select", { value: theme, onChange: (event) => setTheme(event.target.value) }, /* @__PURE__ */ h("option", { value: "mixed" }, "\u6DF7\u5408"), /* @__PURE__ */ h("option", { value: "portrait" }, "\u4EBA\u50CF"), /* @__PURE__ */ h("option", { value: "landscape" }, "\u98CE\u5149"), /* @__PURE__ */ h("option", { value: "event" }, "\u6D3B\u52A8"))), /* @__PURE__ */ h("label", { style: { display: "grid", gap: 4 } }, /* @__PURE__ */ h("span", { style: { fontSize: 12, color: "#9aa3b5" } }, t("budget")), /* @__PURE__ */ h("input", { value: budget, onChange: (event) => setBudget(event.target.value), style: { width: 80, background: "#11151d", border: "1px solid #3a4050", color: "#e8eaf0", borderRadius: 6, padding: "6px 8px" } }))), /* @__PURE__ */ h("button", { type: "button", disabled: busy || folder === "", onClick: create }, busy ? t("creating") : t("create")), error !== null && /* @__PURE__ */ h("div", { style: { color: "#ff8a80", fontSize: 12 } }, error));
}
function ProjectDetail({ t, id }) {
  const [detail, setDetail] = (0, import_react.useState)(null);
  const [photos, setPhotos] = (0, import_react.useState)([]);
  const [progress, setProgress] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)(null);
  const refresh = async () => {
    try {
      setDetail(await api(`/photo-picker/api/projects/${id}`));
      setPhotos(await api(`/photo-picker/api/projects/${id}/photos?limit=24`));
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
  if (detail === null) return /* @__PURE__ */ h("div", { style: { fontSize: 12, color: "#9aa3b5" } }, t("loading"));
  const counts = detail.counts ?? {};
  return /* @__PURE__ */ h("div", { style: { display: "grid", gap: 12 } }, /* @__PURE__ */ h("div", { style: { display: "flex", gap: 10, alignItems: "center" } }, /* @__PURE__ */ h("strong", null, detail.name), /* @__PURE__ */ h("span", { style: { fontSize: 12, color: "#9aa3b5" } }, detail.sourcePath), /* @__PURE__ */ h("span", { style: { marginLeft: "auto", fontSize: 12, color: "#9aa3b5" } }, detail.status)), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12 } }, Object.entries(counts).map(([state, count]) => /* @__PURE__ */ h("span", { key: state, style: { background: "#1a1f2a", borderRadius: 5, padding: "2px 8px" } }, state, ": ", String(count))), detail.running !== null && /* @__PURE__ */ h("span", { style: { color: "#7ee2a8" } }, t("running"), ": ", detail.running)), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ h("button", { type: "button", onClick: () => run("scan") }, t("scan")), /* @__PURE__ */ h("button", { type: "button", onClick: () => run("preprocess") }, t("preprocess"))), progress !== null && /* @__PURE__ */ h("div", { style: { fontSize: 12, color: "#9aa3b5" } }, progress.stage, " ", progress.done ?? 0, "/", progress.total ?? "?", " ", progress.error ?? ""), error !== null && /* @__PURE__ */ h("div", { style: { color: "#ff8a80", fontSize: 12 } }, error), /* @__PURE__ */ h("div", { style: { display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6 } }, photos.map((photo) => /* @__PURE__ */ h("img", { key: photo.id, src: `${photo.thumbUrl}?v=${detail.updatedAt ?? 0}`, alt: photo.relPath, style: { width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 4, background: "#1a1f2a" } }))));
}
function Workbench({ t }) {
  const isOpen = useOpen();
  const [projects, setProjects] = (0, import_react.useState)([]);
  const [selected, setSelected] = (0, import_react.useState)(null);
  const [creating, setCreating] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    if (!isOpen) return;
    api("/photo-picker/api/projects").then(setProjects).catch((cause) => setError(String(cause)));
  }, [isOpen]);
  if (!isOpen) return null;
  return /* @__PURE__ */ h("div", { style: { position: "fixed", inset: 0, background: "rgba(6,8,12,0.72)", zIndex: 9e3, display: "grid", placeItems: "center", pointerEvents: "auto" } }, /* @__PURE__ */ h("div", { style: { width: "min(980px, 92vw)", maxHeight: "88vh", overflow: "auto", background: "#12161f", color: "#e8eaf0", border: "1px solid #2a2f3a", borderRadius: 14, padding: 18 } }, /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 } }, /* @__PURE__ */ h("strong", { style: { fontSize: 16 } }, t("title")), /* @__PURE__ */ h("button", { type: "button", style: { marginLeft: "auto" }, onClick: () => setOpen(false) }, t("close"))), error !== null && /* @__PURE__ */ h("div", { style: { color: "#ff8a80", fontSize: 12, marginBottom: 10 } }, error), selected !== null ? /* @__PURE__ */ h("div", { style: { display: "grid", gap: 10 } }, /* @__PURE__ */ h("button", { type: "button", onClick: () => setSelected(null) }, t("projects")), /* @__PURE__ */ h(ProjectDetail, { t, id: selected })) : creating ? /* @__PURE__ */ h("div", { style: { display: "grid", gap: 10 } }, /* @__PURE__ */ h("button", { type: "button", onClick: () => setCreating(false) }, t("projects")), /* @__PURE__ */ h(CreateForm, { t, onCreated: (id) => {
    setCreating(false);
    setSelected(id);
    api("/photo-picker/api/projects").then(setProjects).catch(() => {
    });
  } })) : /* @__PURE__ */ h("div", { style: { display: "grid", gap: 10 } }, /* @__PURE__ */ h("button", { type: "button", onClick: () => setCreating(true) }, t("newProject")), projects.length === 0 ? /* @__PURE__ */ h("div", { style: { fontSize: 12, color: "#9aa3b5" } }, t("empty")) : projects.map((project) => /* @__PURE__ */ h("button", { type: "button", key: project.id, onClick: () => setSelected(project.id), style: { textAlign: "left", padding: 10 } }, project.name, " \xB7 ", project.sourcePath)))));
}
function Panel({ t }) {
  return /* @__PURE__ */ h(Workbench, { t });
}
var inject = ["slots", "locale"];
function apply(ctx) {
  const t = ctx.locale.bind(NS);
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "photo-picker.locale");
  ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register(
    { name: "conversation.composer.dock", id: "photo-picker-launcher", order: 60 },
    () => /* @__PURE__ */ h(Launcher, { t })
  ));
  ctx.slots.inject("shell.overlay", () => ctx.slots.register(
    { name: "shell.overlay", id: "photo-picker-panel", order: 60 },
    () => /* @__PURE__ */ h(Panel, { t })
  ));
}

    return module.exports;
  },
});
