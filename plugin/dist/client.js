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

// plugin/src/client/locales.js
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
  filterKeep: "\u4FDD\u7559",
  filterMaybe: "\u5F85\u5B9A",
  filterReject: "\u5F03\u7528",
  sortScore: "\u6309\u5206\u6570\uFF08\u9AD8\u2192\u4F4E\uFF09",
  sortScoreAsc: "\u6309\u5206\u6570\uFF08\u4F4E\u2192\u9AD8\uFF09",
  sortTaken: "\u6309\u62CD\u6444\u65F6\u95F4",
  sortPath: "\u6309\u8DEF\u5F84",
  sortGroup: "\u6309\u5206\u7EC4",
  autoRun: "\u81EA\u52A8\u8DD1\uFF08\u626B\u63CF\u2192\u7CBE\u8BC4\uFF09",
  pipelineDone: "\u81EA\u52A8\u8DD1\u5B8C\u6210",
  pipelinePaused: "\u81EA\u52A8\u8DD1\u5DF2\u6682\u505C",
  pipelineFailed: "\u81EA\u52A8\u8DD1\u5931\u8D25",
  revealInFinder: "\u5728 Finder \u4E2D\u663E\u793A",
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
  keyboardHint: "J/K \u524D\u540E \xB7 P \u4FDD\u7559 \xB7 M \u5F85\u5B9A \xB7 X \u5F03\u7528 \xB7 Space \u8FD4\u56DE",
  groupCompare: "\u7EC4\u5BF9\u6BD4 (G)",
  groupKindBurst: "\u8FDE\u62CD",
  groupKindScene: "\u540C\u573A\u666F",
  groupConfirm: "\u786E\u8BA4\u672C\u7EC4 (Enter)",
  groupRejectAll: "\u5168\u7EC4\u5F03\u7528 (X)",
  groupHint: "1\u20136 \u9009\u4E00\u5F20 \xB7 Enter \u786E\u8BA4\u672C\u7EC4\uFF08\u9009\u4E2D keep\uFF0C\u5176\u4F59 reject\uFF09 \xB7 \u2190/\u2192 \u6362\u7EC4 \xB7 Space \u8FD4\u56DE",
  calibration: "\u6821\u51C6",
  calibrationStart: "\u5F00\u59CB\u6821\u51C6",
  calibrationProgress: "\u7B2C {n} / {total} \u5F20",
  calibrationHint: "\u76F2\u8BC4\uFF1A\u53EA\u51ED\u8089\u773C\u5224\u65AD\uFF0C\u4E0D\u770B AI \u5206\u6570\u3002\u5B8C\u6210\u540E\u63ED\u793A\u4E00\u81F4\u7387\u4E0E\u5EFA\u8BAE\u9608\u503C\u3002",
  calibrationPrecision: "\u4FDD\u7559\u7CBE\u786E\u7387",
  calibrationRecall: "\u4FDD\u7559\u53EC\u56DE\u7387",
  calibrationF1: "\u4FDD\u7559 F1",
  calibrationAgreement: "\u4E00\u81F4\u7387",
  calibrationSuggested: "\u5EFA\u8BAE\u9608\u503C",
  calibrationApply: "\u5E94\u7528\u5EFA\u8BAE\u9608\u503C",
  calibrationApplied: "\u5DF2\u5E94\u7528\u5230\u9879\u76EE",
  calibrationNoSample: "\u8FD8\u6CA1\u6709\u5DF2\u8BC4\u5206\u7684\u7167\u7247\uFF0C\u5148\u8DD1\u4E00\u6B21\u5355\u5F20\u7CBE\u8BC4\u518D\u6821\u51C6\u3002",
  calibrationLast: "\u4E0A\u6B21\u6821\u51C6",
  settings: "\u8BBE\u7F6E",
  settingsTitle: "\u9879\u76EE\u8BBE\u7F6E",
  settingsBasic: "\u57FA\u7840",
  model: "\u6A21\u578B",
  concurrency: "\u5E76\u53D1",
  gridSize: "\u7F51\u683C\u89C4\u683C",
  gridCols: "\u5217",
  gridRows: "\u884C",
  thresholds: "\u5224\u5B9A\u9608\u503C",
  thresholdKeep: "\u4FDD\u7559\u9608\u503C",
  thresholdMaybe: "\u5F85\u5B9A\u9608\u503C",
  grouping: "\u5206\u7EC4\u53C2\u6570",
  burstSeconds: "\u8FDE\u62CD\u65F6\u95F4\u7A97\uFF08\u79D2\uFF09",
  burstHamming: "\u8FDE\u62CD\u6C49\u660E\u8DDD\u79BB",
  sceneSeconds: "\u540C\u573A\u666F\u65F6\u95F4\u7A97\uFF08\u79D2\uFF09",
  sceneHamming: "\u540C\u573A\u666F\u6C49\u660E\u8DDD\u79BB",
  runOptions: "\u8FD0\u884C\u9009\u9879",
  stagePause: "\u9636\u6BB5\u95F4\u6682\u505C",
  offpeak: "\u53EA\u5728\u79BB\u5CF0\u65F6\u6BB5\u8C03\u7528",
  promptSection: "\u63D0\u793A\u8BCD",
  viewPrompt: "\u67E5\u770B\u63D0\u793A\u8BCD\u5168\u6587",
  save: "\u4FDD\u5B58\u8BBE\u7F6E",
  saved: "\u5DF2\u4FDD\u5B58",
  settingsHint: "\u9608\u503C\u3001\u5206\u7EC4\u53C2\u6570\u4E0E\u63D0\u793A\u8BCD\u6539\u52A8\u5F71\u54CD\u540E\u7EED\u9636\u6BB5\uFF1B\u5206\u7EC4\u53C2\u6570\u9700\u8981\u91CD\u8DD1\u9884\u5904\u7406\u624D\u751F\u6548\u3002",
  rerunStages: "\u91CD\u8DD1\u53D7\u5F71\u54CD\u9636\u6BB5",
  rerun: "\u91CD\u8DD1",
  settingsNoImageModel: "\u5F53\u524D\u6A21\u578B\u4E0D\u652F\u6301\u56FE\u7247\u8F93\u5165\uFF0CAI \u9636\u6BB5\u4F1A\u88AB\u7981\u7528\u3002",
  photos: "\u7167\u7247",
  close: "\u5173\u95ED",
  verdictKeep: "\u4FDD\u7559",
  verdictMaybe: "\u5F85\u5B9A",
  verdictReject: "\u5F03\u7528",
  stateOk: "\u6B63\u5E38",
  stateCandidate: "\u5019\u9009",
  stateUnreadable: "\u4E0D\u53EF\u8BFB",
  stateFilteredDup: "\u91CD\u590D",
  stateFilteredBlur: "\u6A21\u7CCA",
  stateFilteredExposure: "\u66DD\u5149\u5F02\u5E38",
  stateFilteredSmall: "\u5206\u8FA8\u7387\u8FC7\u5C0F",
  stateGridSelected: "\u7C97\u7B5B\u5165\u9009",
  stateGridRejected: "\u7C97\u7B5B\u843D\u9009",
  stateGridError: "\u7C97\u7B5B\u5931\u8D25",
  stateScored: "\u5DF2\u8BC4\u5206",
  stateScoreFailed: "\u8BC4\u5206\u5931\u8D25",
  runPending: "\u7B49\u5F85\u4E2D",
  runRunning: "\u8FD0\u884C\u4E2D",
  runPaused: "\u5DF2\u6682\u505C",
  runDone: "\u5DF2\u5B8C\u6210",
  runFailed: "\u5931\u8D25",
  runCancelled: "\u5DF2\u53D6\u6D88",
  statPhotos: "\u7167\u7247",
  statSkipped: "\u8DF3\u8FC7",
  statErrors: "\u9519\u8BEF",
  statSelected: "\u9009\u4E2D",
  statRejected: "\u843D\u9009",
  statFailed: "\u5931\u8D25",
  statGroups: "\u5206\u7EC4",
  statKept: "\u6DD8\u6C70",
  statScored: "\u8BC4\u5206",
  statDone: "\u5B8C\u6210",
  secondsShort: "\u79D2",
  phaseStart: "\u5F00\u59CB",
  phaseDone: "\u5B8C\u6210",
  language: "\u754C\u9762\u8BED\u8A00",
  languageAuto: "\u8DDF\u968F\u6D4F\u89C8\u5668",
  namePlaceholder: "2024 \u5A5A\u793C",
  destPlaceholder: "/Volumes/\u2026/\u7CBE\u9009",
  groupRank: "\u7EC4\u5185\u7B2C {rank}/{size}",
  nextStage: "\u4E0B\u4E00\u9636\u6BB5"
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
  filterKeep: "\u4FDD\u7559",
  filterMaybe: "\u5F85\u5B9A",
  filterReject: "\u5F03\u7528",
  sortScore: "By score (high\u2192low)",
  sortScoreAsc: "By score (low\u2192high)",
  sortTaken: "By time",
  sortPath: "By path",
  sortGroup: "By group",
  autoRun: "Auto run (scan\u2192score)",
  pipelineDone: "Auto run finished",
  pipelinePaused: "Auto run paused",
  pipelineFailed: "Auto run failed",
  revealInFinder: "Reveal in Finder",
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
  keyboardHint: "J/K prev/next \xB7 P keep \xB7 M maybe \xB7 X reject \xB7 Space back",
  groupCompare: "Compare group (G)",
  groupKindBurst: "Burst",
  groupKindScene: "Scene",
  groupConfirm: "Confirm group (Enter)",
  groupRejectAll: "Reject group (X)",
  groupHint: "1\u20136 pick one \xB7 Enter confirm (chosen keep, rest reject) \xB7 \u2190/\u2192 switch group \xB7 Space back",
  calibration: "Calibration",
  calibrationStart: "Start calibration",
  calibrationProgress: "{n} / {total}",
  calibrationHint: "Blind review: judge by eye only, AI scores stay hidden. Finish to reveal agreement and a suggested threshold.",
  calibrationPrecision: "Keep precision",
  calibrationRecall: "Keep recall",
  calibrationF1: "Keep F1",
  calibrationAgreement: "Agreement",
  calibrationSuggested: "Suggested threshold",
  calibrationApply: "Apply suggested threshold",
  calibrationApplied: "Applied to project",
  calibrationNoSample: "No scored photos yet. Run single-photo scoring first.",
  calibrationLast: "Previous calibration",
  settings: "Settings",
  settingsTitle: "Project settings",
  settingsBasic: "Basics",
  model: "Model",
  concurrency: "Concurrency",
  gridSize: "Grid size",
  gridCols: "Columns",
  gridRows: "Rows",
  thresholds: "Verdict thresholds",
  thresholdKeep: "Keep threshold",
  thresholdMaybe: "Maybe threshold",
  grouping: "Grouping",
  burstSeconds: "Burst window (s)",
  burstHamming: "Burst hamming",
  sceneSeconds: "Scene window (s)",
  sceneHamming: "Scene hamming",
  runOptions: "Run options",
  stagePause: "Pause between stages",
  offpeak: "Only call during off-peak hours",
  promptSection: "Prompts",
  viewPrompt: "View full prompts",
  save: "Save settings",
  saved: "Saved",
  settingsHint: "Thresholds, grouping and prompt changes affect later stages; grouping needs a preprocess re-run.",
  rerunStages: "Re-run affected stages",
  rerun: "Re-run",
  settingsNoImageModel: "The current model does not accept image input; AI stages will be disabled.",
  photos: "photos",
  close: "Close",
  verdictKeep: "Keep",
  verdictMaybe: "Maybe",
  verdictReject: "Reject",
  stateOk: "ok",
  stateCandidate: "candidate",
  stateUnreadable: "unreadable",
  stateFilteredDup: "duplicate",
  stateFilteredBlur: "blurry",
  stateFilteredExposure: "bad exposure",
  stateFilteredSmall: "too small",
  stateGridSelected: "grid selected",
  stateGridRejected: "grid rejected",
  stateGridError: "grid error",
  stateScored: "scored",
  stateScoreFailed: "score failed",
  runPending: "pending",
  runRunning: "running",
  runPaused: "paused",
  runDone: "done",
  runFailed: "failed",
  runCancelled: "cancelled",
  statPhotos: "photos",
  statSkipped: "skipped",
  statErrors: "errors",
  statSelected: "selected",
  statRejected: "rejected",
  statFailed: "failed",
  statGroups: "groups",
  statKept: "kept",
  statScored: "scored",
  statDone: "done",
  secondsShort: "s",
  phaseStart: "start",
  phaseDone: "done",
  language: "Language",
  languageAuto: "Follow browser",
  namePlaceholder: "2024 wedding",
  destPlaceholder: "/Volumes/\u2026/selects",
  groupRank: "rank {rank}/{size} in group",
  nextStage: "next stage"
};
var STORAGE_KEY = "photoPicker.lang";
var listeners = /* @__PURE__ */ new Set();
function detectLanguage(nav, stored) {
  const override = stored ?? (typeof localStorage === "undefined" ? null : localStorage.getItem(STORAGE_KEY));
  if (override === "zh" || override === "en") return override;
  const candidates = [];
  const source = nav ?? (typeof navigator === "undefined" ? void 0 : navigator);
  if (source !== void 0) {
    if (Array.isArray(source.languages)) candidates.push(...source.languages);
    if (typeof source.language === "string") candidates.push(source.language);
  }
  for (const candidate of candidates) {
    const language = String(candidate).toLowerCase();
    if (language.startsWith("zh")) return "zh";
    if (language.startsWith("en")) return "en";
  }
  return "en";
}
function getLanguage() {
  return detectLanguage();
}
function setLanguage(value) {
  if (typeof localStorage !== "undefined") {
    if (value === "auto") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value);
  }
  for (const listener of listeners) listener();
}
function subscribeLanguage(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function translate(language, key) {
  const dictionary = language === "zh" ? zh : en;
  return dictionary[key] ?? en[key] ?? zh[key] ?? key;
}

// plugin/src/client/index.tsx
var h = import_react.default.createElement;
var Fragment = import_react.default.Fragment;
var NS = "photoPicker";
var PANEL_ID = "photo-picker";
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
var VERDICT_KEYS = { keep: "verdictKeep", maybe: "verdictMaybe", reject: "verdictReject" };
var STATE_KEYS = {
  ok: "stateOk",
  candidate: "stateCandidate",
  unreadable: "stateUnreadable",
  filtered_dup: "stateFilteredDup",
  filtered_blur: "stateFilteredBlur",
  filtered_exposure: "stateFilteredExposure",
  filtered_small: "stateFilteredSmall",
  grid_selected: "stateGridSelected",
  grid_rejected: "stateGridRejected",
  grid_error: "stateGridError",
  scored: "stateScored",
  score_failed: "stateScoreFailed"
};
var RUN_STATUS_KEYS = {
  pending: "runPending",
  running: "runRunning",
  paused: "runPaused",
  done: "runDone",
  failed: "runFailed",
  cancelled: "runCancelled"
};
var STAT_KEYS = [
  ["photos", "statPhotos"],
  ["skipped", "statSkipped"],
  ["errors", "statErrors"],
  ["selected", "statSelected"],
  ["rejected", "statRejected"],
  ["failed", "statFailed"],
  ["groups", "statGroups"],
  ["kept", "statKept"],
  ["scored", "statScored"],
  ["done", "statDone"]
];
var PHASE_KEYS = { start: "phaseStart", done: "phaseDone" };
function verdictLabel(t, verdict) {
  if (verdict === null || verdict === void 0) return "\u2014";
  return VERDICT_KEYS[verdict] === void 0 ? verdict : t(VERDICT_KEYS[verdict]);
}
function stateLabel(t, state) {
  return STATE_KEYS[state] === void 0 ? state : t(STATE_KEYS[state]);
}
function runStatusLabel(t, status) {
  return RUN_STATUS_KEYS[status] === void 0 ? status : t(RUN_STATUS_KEYS[status]);
}
function phaseLabel(t, phase) {
  return PHASE_KEYS[phase] === void 0 ? phase : t(PHASE_KEYS[phase]);
}
function summarizeStats(t, stats) {
  if (stats === null || stats === void 0) return "";
  const parts = [];
  for (const [key, labelKey] of STAT_KEYS) {
    if (typeof stats[key] === "number") parts.push(`${t(labelKey)} ${stats[key]}`);
  }
  if (typeof stats.durationMs === "number") parts.push(`${Math.round(stats.durationMs / 1e3)}${t("secondsShort")}`);
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
  ))), /* @__PURE__ */ h("label", { style: { display: "grid", gap: 6 } }, /* @__PURE__ */ h("span", { style: muted }, t("name")), /* @__PURE__ */ h("input", { value: name, onChange: (event) => setName(event.target.value), placeholder: t("namePlaceholder"), style: input })), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 14 } }, /* @__PURE__ */ h("label", { style: { display: "grid", gap: 6 } }, /* @__PURE__ */ h("span", { style: muted }, t("theme")), /* @__PURE__ */ h("select", { value: theme, onChange: (event) => setTheme(event.target.value), style: input }, /* @__PURE__ */ h("option", { value: "mixed" }, t("themeMixed")), /* @__PURE__ */ h("option", { value: "portrait" }, t("themePortrait")), /* @__PURE__ */ h("option", { value: "landscape" }, t("themeLandscape")), /* @__PURE__ */ h("option", { value: "event" }, t("themeEvent")))), /* @__PURE__ */ h("label", { style: { display: "grid", gap: 6 } }, /* @__PURE__ */ h("span", { style: muted }, t("budget")), /* @__PURE__ */ h("input", { value: budget, onChange: (event) => setBudget(event.target.value), style: { ...input, width: 100 } }))), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ h("button", { type: "button", style: btnPrimary, disabled: busy || folder === "", onClick: create }, busy ? t("creating") : t("create")), /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: onCancel }, t("back"))), error !== null && /* @__PURE__ */ h("div", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)", fontSize: 12 } }, error));
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
  const [groupView, setGroupView] = (0, import_react.useState)(null);
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
  if (groupView !== null) {
    return /* @__PURE__ */ h(
      GroupCompare,
      {
        t,
        projectId,
        groupId: groupView,
        version,
        onNavigate: setGroupView,
        onClose: () => setGroupView(null),
        onDecided: async () => {
          await load();
          onChanged?.();
        }
      }
    );
  }
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
        onOpenGroup: setGroupView,
        onDecide: decide,
        onClose: () => setSingle(null)
      }
    );
  }
  const filters = [
    ["all", t("filterAll")],
    ["keep", verdictLabel(t, "keep")],
    ["maybe", verdictLabel(t, "maybe")],
    ["reject", verdictLabel(t, "reject")]
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
  )), /* @__PURE__ */ h("select", { value: sort, onChange: (event) => setSort(event.target.value), style: { ...input, padding: "4px 8px", fontSize: 12 } }, /* @__PURE__ */ h("option", { value: "score" }, t("sortScore")), /* @__PURE__ */ h("option", { value: "score_asc" }, t("sortScoreAsc")), /* @__PURE__ */ h("option", { value: "group" }, t("sortGroup")), /* @__PURE__ */ h("option", { value: "taken_at" }, t("sortTaken")), /* @__PURE__ */ h("option", { value: "rel_path" }, t("sortPath"))), /* @__PURE__ */ h("span", { style: { ...muted, marginLeft: "auto" } }, items.length, " / ", t("photos"))), /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ h("span", { style: muted }, t("selectedCount"), ": ", selected.length), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: selected.length === 0, onClick: () => decide(selected, "keep") }, t("keep")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: selected.length === 0, onClick: () => decide(selected, "maybe") }, t("maybe")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: selected.length === 0, onClick: () => decide(selected, "reject") }, t("reject")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: undo.length === 0, onClick: undoLast }, t("undoAction"))), error !== null && /* @__PURE__ */ h("div", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)", fontSize: 12 } }, error), items.length === 0 ? /* @__PURE__ */ h("div", { style: { ...muted, fontSize: 13 } }, t("noPhotos")) : /* @__PURE__ */ h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))", gap: 8 } }, items.map((item) => /* @__PURE__ */ h("div", { key: item.id, style: { position: "relative" } }, /* @__PURE__ */ h(
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
    item.humanVerdict !== null && /* @__PURE__ */ h("span", { style: { position: "absolute", bottom: 8, right: 6, padding: "1px 5px", borderRadius: 5, background: "rgba(0,0,0,0.62)", color: "#fff", fontSize: 10 } }, verdictLabel(t, item.humanVerdict))
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
function PhotoSingle({ t, projectId, items, photoId, version, onNavigate, onOpenGroup, onDecide, onClose }) {
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
      else if (event.key === "g" && detail?.group !== void 0) onOpenGroup(detail.group.id);
      else if (event.key === " " || event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photoId, index, items, detail]);
  if (error !== null) return /* @__PURE__ */ h("div", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)", fontSize: 12 } }, error);
  if (detail === null) return /* @__PURE__ */ h("div", { style: { ...muted, fontSize: 13 } }, t("loading"));
  const dimensions = detail.dimensions ?? {};
  return /* @__PURE__ */ h("div", { style: { display: "grid", gap: 10 } }, /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: onClose }, t("backToWall")), detail.group !== void 0 && /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => onOpenGroup(detail.group.id) }, t("groupCompare")), /* @__PURE__ */ h("span", { style: muted }, index + 1, " / ", items.length), /* @__PURE__ */ h("span", { style: { ...chip, background: VERDICT_COLORS[detail.verdict] ?? "var(--dsw-alias-bg-layer-2)", color: "#fff" } }, verdictLabel(t, detail.verdict)), detail.score !== null && /* @__PURE__ */ h("span", { style: chip }, t("scoreLabel"), ": ", detail.score), /* @__PURE__ */ h("span", { style: { ...muted, marginLeft: "auto" } }, detail.relPath)), /* @__PURE__ */ h("div", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: 14, alignItems: "start" } }, /* @__PURE__ */ h(
    "img",
    {
      src: `${detail.previewUrl}?v=${version}`,
      alt: detail.relPath,
      style: { width: "100%", maxHeight: "72vh", objectFit: "contain", borderRadius: 10, background: "var(--dsw-alias-bg-layer-2)" }
    }
  ), /* @__PURE__ */ h("div", { style: { display: "grid", gap: 10 } }, /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => onDecide([photoId], "keep") }, t("keep")), /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => onDecide([photoId], "maybe") }, t("maybe")), /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => onDecide([photoId], "reject") }, t("reject"))), /* @__PURE__ */ h("div", { style: { ...muted, fontSize: 12 } }, t("keyboardHint")), /* @__PURE__ */ h("div", { style: { display: "grid", gap: 6 } }, Object.keys(DIMENSION_LABELS).map((key) => {
    const value = dimensions[key];
    return /* @__PURE__ */ h("div", { key, style: { display: "grid", gridTemplateColumns: "64px 1fr 28px", gap: 8, alignItems: "center", fontSize: 12 } }, /* @__PURE__ */ h("span", { style: muted }, t(DIMENSION_LABELS[key])), /* @__PURE__ */ h("div", { style: { height: 6, borderRadius: 3, background: "var(--dsw-alias-bg-layer-2)", overflow: "hidden" } }, /* @__PURE__ */ h("div", { style: { height: "100%", width: `${Math.max(0, Math.min(10, value ?? 0)) * 10}%`, background: "var(--dsw-alias-brand-primary)" } })), /* @__PURE__ */ h("span", null, value === null || value === void 0 ? "\u2014" : value));
  })), detail.reason !== null && /* @__PURE__ */ h("div", { style: { display: "grid", gap: 4 } }, /* @__PURE__ */ h("span", { style: { ...muted, fontWeight: 600 } }, t("reason")), /* @__PURE__ */ h("span", { style: { fontSize: 13 } }, detail.reason)), (detail.postProcessing ?? []).length > 0 && /* @__PURE__ */ h("div", { style: { display: "grid", gap: 4 } }, /* @__PURE__ */ h("span", { style: { ...muted, fontWeight: 600 } }, t("postProcessing")), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, detail.postProcessing.map((code) => /* @__PURE__ */ h("span", { key: code, style: chip }, code)))), /* @__PURE__ */ h("div", { style: muted }, detail.width, " \xD7 ", detail.height, detail.group !== void 0 ? ` \xB7 ${t("groupRank").replace("{rank}", String(detail.group.rank)).replace("{size}", String(detail.group.size))}` : ""))));
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
      placeholder: t("destPlaceholder"),
      style: { ...input, flex: 1 }
    }
  ), /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: choose }, t("exportChoose")))), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ h("span", { style: muted }, t("exportBuckets")), ["keep", "maybe", "reject"].map((bucket) => /* @__PURE__ */ h("label", { key: bucket, style: { display: "flex", gap: 4, alignItems: "center", fontSize: 13 } }, /* @__PURE__ */ h("input", { type: "checkbox", checked: buckets.includes(bucket), onChange: () => toggleBucket(bucket) }), verdictLabel(t, bucket))), /* @__PURE__ */ h("span", { style: { ...muted, marginLeft: 8 } }, t("exportMode")), /* @__PURE__ */ h("select", { value: mode, onChange: (event) => setMode(event.target.value), style: { ...input, padding: "4px 8px", fontSize: 12 } }, /* @__PURE__ */ h("option", { value: "hardlink" }, t("exportHardlink")), /* @__PURE__ */ h("option", { value: "copy" }, t("exportCopy")))), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: busy || dest === "", onClick: () => execute("preview") }, t("exportPreview")), /* @__PURE__ */ h("button", { type: "button", style: btnPrimary, disabled: busy || dest === "" || preview === null, onClick: () => execute("run") }, t("exportRun"))), error !== null && /* @__PURE__ */ h("div", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)", fontSize: 12 } }, error), preview !== null && /* @__PURE__ */ h("div", { style: { display: "grid", gap: 4, fontSize: 13 } }, /* @__PURE__ */ h("span", null, Object.entries(preview.counts).map(([bucket, count]) => `${verdictLabel(t, bucket)} ${count}`).join(" \xB7 "), " \xB7 ", (preview.totalBytes / 1024 / 1024).toFixed(1), " MB"), /* @__PURE__ */ h("span", { style: muted }, t("exportSkipped"), " ", preview.skippedExisting, " \xB7 ", t("exportConflict"), " ", preview.conflictCount, " \xB7 ", preview.sameVolume ? t("exportSameVolume") : t("exportCrossVolume"))), result !== null && /* @__PURE__ */ h("div", { style: { display: "grid", gap: 4, fontSize: 13 } }, /* @__PURE__ */ h("span", null, t("exportResult"), ": ", Object.entries(result.counts).map(([bucket, count]) => `${verdictLabel(t, bucket)} ${count}`).join(" \xB7 ")), /* @__PURE__ */ h("span", { style: muted }, t("manifest"), ": ", result.manifestPath), /* @__PURE__ */ h("div", null, /* @__PURE__ */ h(
    "button",
    {
      type: "button",
      style: btn,
      onClick: () => api("/photo-picker/api/fs/reveal", {
        method: "POST",
        body: JSON.stringify({ path: result.manifestPath ?? dest })
      }).catch((cause) => setError(String(cause)))
    },
    t("revealInFinder")
  )), result.failureCount > 0 && /* @__PURE__ */ h("span", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)" } }, t("exportConflict"), ": ", result.failureCount))));
}
function GroupCompare({ t, projectId, groupId, version, onNavigate, onClose, onDecided }) {
  const [groups, setGroups] = (0, import_react.useState)([]);
  const [detail, setDetail] = (0, import_react.useState)(null);
  const [selected, setSelected] = (0, import_react.useState)(0);
  const [page, setPage] = (0, import_react.useState)(0);
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    api(`/photo-picker/api/projects/${projectId}/groups?limit=200`).then((data) => setGroups(data.items)).catch(() => {
    });
  }, [projectId]);
  (0, import_react.useEffect)(() => {
    setDetail(null);
    setSelected(0);
    setPage(0);
    api(`/photo-picker/api/projects/${projectId}/groups/${groupId}`).then(setDetail).catch((cause) => setError(String(cause)));
  }, [groupId]);
  const index = groups.findIndex((group) => group.id === groupId);
  const switchGroup = (delta) => {
    const next = groups[index + delta];
    if (next !== void 0) onNavigate(next.id);
  };
  const decide = async (verdict, ids) => {
    setBusy(true);
    try {
      await api(`/photo-picker/api/projects/${projectId}/decisions`, {
        method: "POST",
        body: JSON.stringify({ photoIds: ids, verdict })
      });
      await onDecided?.();
      onClose();
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  };
  const confirm = async () => {
    if (detail === null) return;
    const chosen = detail.members[selected];
    setBusy(true);
    try {
      await api(`/photo-picker/api/projects/${projectId}/decisions`, {
        method: "POST",
        body: JSON.stringify({ photoIds: detail.members.map((member) => member.id), verdict: "reject" })
      });
      if (chosen !== void 0) {
        await api(`/photo-picker/api/projects/${projectId}/decisions`, {
          method: "POST",
          body: JSON.stringify({ photoIds: [chosen.id], verdict: "keep" })
        });
      }
      await onDecided?.();
      onClose();
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  };
  (0, import_react.useEffect)(() => {
    const onKey = (event) => {
      const target = event.target;
      if (target !== null && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "Escape" || event.key === " ") onClose();
      else if (event.key === "ArrowLeft") switchGroup(-1);
      else if (event.key === "ArrowRight") switchGroup(1);
      else if (event.key === "Enter") confirm();
      else if (event.key === "x" || event.key === "X") {
        if (detail !== null) decide("reject", detail.members.map((member) => member.id));
      } else if (/^[1-6]$/.test(event.key) && detail !== null) {
        const position = page * 6 + Number(event.key) - 1;
        if (position < detail.members.length) setSelected(position);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail, selected, index, groups, page]);
  if (error !== null) return /* @__PURE__ */ h("div", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)", fontSize: 12 } }, error);
  if (detail === null) return /* @__PURE__ */ h("div", { style: { ...muted, fontSize: 13 } }, t("loading"));
  const kindLabel = detail.kind === "burst" ? t("groupKindBurst") : t("groupKindScene");
  const pageCount = Math.max(1, Math.ceil(detail.members.length / 6));
  const pageStart = page * 6;
  const visible = detail.members.slice(pageStart, pageStart + 6);
  return /* @__PURE__ */ h("div", { style: { display: "grid", gap: 12 } }, /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: onClose }, t("backToWall")), /* @__PURE__ */ h("span", { style: chip }, kindLabel), /* @__PURE__ */ h("span", { style: chip }, detail.size, " ", t("photos")), pageCount > 1 && /* @__PURE__ */ h("span", { style: chip }, page + 1, " / ", pageCount), /* @__PURE__ */ h("span", { style: muted }, index >= 0 ? `${index + 1} / ${groups.length}` : ""), /* @__PURE__ */ h("div", { style: { marginLeft: "auto", display: "flex", gap: 6 } }, pageCount > 1 && /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: page === 0, onClick: () => {
    setPage(page - 1);
    setSelected(pageStart - 6);
  } }, "\u2039"), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: page >= pageCount - 1, onClick: () => {
    setPage(page + 1);
    setSelected(pageStart + 6);
  } }, "\u203A")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: index <= 0, onClick: () => switchGroup(-1) }, "\u2190"), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: index < 0 || index >= groups.length - 1, onClick: () => switchGroup(1) }, "\u2192"))), /* @__PURE__ */ h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 } }, visible.map((member, localPosition) => {
    const position = pageStart + localPosition;
    return /* @__PURE__ */ h(
      "button",
      {
        key: member.id,
        type: "button",
        onClick: () => setSelected(position),
        style: {
          padding: 0,
          overflow: "hidden",
          borderRadius: 10,
          cursor: "pointer",
          position: "relative",
          border: position === selected ? "2px solid var(--dsw-alias-brand-primary)" : "1px solid var(--dsw-alias-border-l1)",
          background: "var(--dsw-alias-bg-layer-2)"
        }
      },
      /* @__PURE__ */ h(
        "img",
        {
          src: `${member.thumbUrl}?v=${version}`,
          alt: member.relPath,
          style: { width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }
        }
      ),
      /* @__PURE__ */ h("span", { style: { position: "absolute", top: 6, left: 6, padding: "1px 6px", borderRadius: 6, background: "rgba(0,0,0,0.62)", color: "#fff", fontSize: 11 } }, "#", position + 1, member.score !== null && member.score !== void 0 ? ` \xB7 ${Number(member.score).toFixed(1)}` : ""),
      member.humanVerdict !== null && /* @__PURE__ */ h("span", { style: { position: "absolute", bottom: 6, right: 6, padding: "1px 6px", borderRadius: 6, background: "rgba(0,0,0,0.62)", color: "#fff", fontSize: 10 } }, verdictLabel(t, member.humanVerdict))
    );
  })), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ h("button", { type: "button", style: btnPrimary, disabled: busy, onClick: confirm }, t("groupConfirm")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: busy, onClick: () => decide("reject", detail.members.map((member) => member.id)) }, t("groupRejectAll"))), /* @__PURE__ */ h("div", { style: { ...muted, fontSize: 12 } }, t("groupHint")));
}
function CalibrationSection({ t, projectId, onApplied }) {
  const [phase, setPhase] = (0, import_react.useState)("idle");
  const [items, setItems] = (0, import_react.useState)([]);
  const [index, setIndex] = (0, import_react.useState)(0);
  const [labels, setLabels] = (0, import_react.useState)([]);
  const [report, setReport] = (0, import_react.useState)(null);
  const [latest, setLatest] = (0, import_react.useState)(null);
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [applied, setApplied] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    api(`/photo-picker/api/projects/${projectId}/calibration`).then(setLatest).catch(() => {
    });
  }, [projectId]);
  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const sample = await api(`/photo-picker/api/projects/${projectId}/calibration/sample?size=80`);
      if (sample.items.length === 0) {
        setError(t("calibrationNoSample"));
        return;
      }
      setItems(sample.items);
      setIndex(0);
      setLabels([]);
      setReport(null);
      setApplied(false);
      setPhase("blind");
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  };
  const submit = async (allLabels) => {
    setBusy(true);
    try {
      const computed = await api(`/photo-picker/api/projects/${projectId}/calibration`, {
        method: "POST",
        body: JSON.stringify({ labels: allLabels })
      });
      setReport(computed);
      setLatest(computed);
      setPhase("report");
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  };
  const label = async (verdict) => {
    const item = items[index];
    if (item === void 0) return;
    const nextLabels = [...labels, { photoId: item.id, verdict }];
    setLabels(nextLabels);
    if (index + 1 < items.length) {
      setIndex(index + 1);
      return;
    }
    await submit(nextLabels);
  };
  const apply2 = async () => {
    const source = report ?? latest?.metrics;
    if (source === null || source === void 0) return;
    const keep = source.suggestedKeep;
    const maybe = source.suggestedMaybe;
    if (keep === void 0) return;
    setBusy(true);
    try {
      await api(`/photo-picker/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ thresholdKeep: keep, thresholdMaybe: maybe })
      });
      setApplied(true);
      onApplied?.();
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  };
  const summary = (data) => /* @__PURE__ */ h("div", { style: { display: "grid", gap: 6, fontSize: 13 } }, /* @__PURE__ */ h("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } }, /* @__PURE__ */ h("span", null, t("calibrationPrecision"), ": ", (data.keep?.precision ?? 0).toFixed(2)), /* @__PURE__ */ h("span", null, t("calibrationRecall"), ": ", (data.keep?.recall ?? 0).toFixed(2)), /* @__PURE__ */ h("span", null, t("calibrationF1"), ": ", (data.keep?.f1 ?? 0).toFixed(2)), /* @__PURE__ */ h("span", null, t("calibrationAgreement"), ": ", ((data.agreement ?? 0) * 100).toFixed(0), "%")), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ h("span", { style: chip }, t("calibrationSuggested"), ": ", verdictLabel(t, "keep"), " \u2265 ", data.suggestedKeep, " \xB7 ", verdictLabel(t, "maybe"), " \u2265 ", data.suggestedMaybe), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: busy, onClick: apply2 }, applied ? t("calibrationApplied") : t("calibrationApply"))));
  return /* @__PURE__ */ h("div", { style: { display: "grid", gap: 10 } }, /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ h("span", { style: { ...muted, fontWeight: 600 } }, t("calibration")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: busy, onClick: start }, t("calibrationStart")), phase === "idle" && latest?.metrics !== null && latest?.metrics !== void 0 && /* @__PURE__ */ h("span", { style: { ...muted, marginLeft: "auto" } }, t("calibrationLast"), ": ", latest.sampleSize, " ", t("photos"))), error !== null && /* @__PURE__ */ h("div", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)", fontSize: 12 } }, error), phase === "idle" && latest?.metrics !== null && latest?.metrics !== void 0 && summary(latest.metrics), phase === "blind" && items[index] !== void 0 && /* @__PURE__ */ h("div", { style: { display: "grid", gap: 10 } }, /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ h("span", { style: chip }, t("calibrationProgress").replace("{n}", String(index + 1)).replace("{total}", String(items.length))), /* @__PURE__ */ h("span", { style: { ...muted, marginLeft: "auto" } }, t("calibrationHint"))), /* @__PURE__ */ h(
    "img",
    {
      src: items[index].previewUrl,
      alt: items[index].relPath,
      style: { width: "100%", maxHeight: "62vh", objectFit: "contain", borderRadius: 10, background: "var(--dsw-alias-bg-layer-2)" }
    }
  ), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: busy, onClick: () => label("keep") }, t("keep")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: busy, onClick: () => label("maybe") }, t("maybe")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: busy, onClick: () => label("reject") }, t("reject")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: busy, onClick: () => setPhase("idle") }, t("close")))), phase === "report" && report !== null && summary(report));
}
function SettingsDrawer({ t, detail, onClose, onSaved, onRunStage }) {
  const [form, setForm] = (0, import_react.useState)(() => ({
    theme: detail.theme ?? "mixed",
    modelId: detail.modelId ?? "deepseek-flash",
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
    offpeakOnly: detail.offpeakOnly === true
  }));
  const [prompt, setPrompt] = (0, import_react.useState)(null);
  const [models, setModels] = (0, import_react.useState)([]);
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [saved, setSaved] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    api(`/photo-picker/api/prompt?project=${detail.id}`).then(setPrompt).catch(() => {
    });
    api(`/photo-picker/api/models?route=${encodeURIComponent(detail.modelRoute ?? "deepseek-official")}`).then((data) => setModels(data.models ?? [])).catch(() => {
    });
  }, [detail.id]);
  const set = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await api(`/photo-picker/api/projects/${detail.id}`, {
        method: "PATCH",
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
          offpeakOnly: form.offpeakOnly
        })
      });
      setSaved(true);
      onSaved?.();
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  };
  const label = { display: "grid", gap: 4, fontSize: 12, color: "var(--dsw-alias-label-secondary)" };
  const row = { display: "flex", gap: 8, alignItems: "center" };
  const numberInput = { ...input, width: 88, padding: "5px 8px" };
  return /* @__PURE__ */ h(
    "div",
    {
      onClick: onClose,
      style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.28)", zIndex: 80 }
    },
    /* @__PURE__ */ h(
      "div",
      {
        onClick: (event) => event.stopPropagation(),
        style: {
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(440px, 94vw)",
          background: "var(--dsw-alias-bg-overlay)",
          color: "var(--dsw-alias-label-primary)",
          borderLeft: "1px solid var(--dsw-alias-border-l1)",
          padding: 18,
          overflow: "auto",
          display: "grid",
          gap: 14,
          alignContent: "start"
        }
      },
      /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center" } }, /* @__PURE__ */ h("strong", null, t("settingsTitle")), /* @__PURE__ */ h("button", { type: "button", style: { ...btn, marginLeft: "auto" }, onClick: onClose }, t("close"))),
      /* @__PURE__ */ h("div", { style: { display: "grid", gap: 10 } }, /* @__PURE__ */ h("span", { style: { ...muted, fontWeight: 600 } }, t("settingsBasic")), /* @__PURE__ */ h("label", { style: label }, t("theme"), /* @__PURE__ */ h("select", { value: form.theme, onChange: (event) => set("theme", event.target.value), style: input }, /* @__PURE__ */ h("option", { value: "mixed" }, t("themeMixed")), /* @__PURE__ */ h("option", { value: "portrait" }, t("themePortrait")), /* @__PURE__ */ h("option", { value: "landscape" }, t("themeLandscape")), /* @__PURE__ */ h("option", { value: "event" }, t("themeEvent")))), /* @__PURE__ */ h("label", { style: label }, t("model"), /* @__PURE__ */ h("select", { value: form.modelId, onChange: (event) => set("modelId", event.target.value), style: input }, (models.length === 0 ? [{ id: form.modelId, name: form.modelId }] : models).map((model) => {
        const supportsImage = Array.isArray(model.inputModalities) ? model.inputModalities.includes("image") : true;
        return /* @__PURE__ */ h("option", { key: model.id, value: model.id, disabled: !supportsImage }, model.name ?? model.id, supportsImage ? "" : ` \u2014 ${t("settingsNoImageModel")}`);
      }))), /* @__PURE__ */ h("div", { style: { ...row } }, /* @__PURE__ */ h("label", { style: label }, t("concurrency"), /* @__PURE__ */ h("input", { value: form.concurrency, onChange: (event) => set("concurrency", event.target.value), style: numberInput })), /* @__PURE__ */ h("label", { style: label }, t("budget"), /* @__PURE__ */ h("input", { value: form.budgetCny, onChange: (event) => set("budgetCny", event.target.value), style: numberInput })))),
      /* @__PURE__ */ h("div", { style: { display: "grid", gap: 10 } }, /* @__PURE__ */ h("span", { style: { ...muted, fontWeight: 600 } }, t("gridSize"), " / ", t("thresholds")), /* @__PURE__ */ h("div", { style: row }, /* @__PURE__ */ h("label", { style: label }, t("gridCols"), /* @__PURE__ */ h("input", { value: form.gridCols, onChange: (event) => set("gridCols", event.target.value), style: numberInput })), /* @__PURE__ */ h("label", { style: label }, t("gridRows"), /* @__PURE__ */ h("input", { value: form.gridRows, onChange: (event) => set("gridRows", event.target.value), style: numberInput }))), /* @__PURE__ */ h("div", { style: row }, /* @__PURE__ */ h("label", { style: label }, t("thresholdKeep"), /* @__PURE__ */ h("input", { value: form.thresholdKeep, onChange: (event) => set("thresholdKeep", event.target.value), style: numberInput })), /* @__PURE__ */ h("label", { style: label }, t("thresholdMaybe"), /* @__PURE__ */ h("input", { value: form.thresholdMaybe, onChange: (event) => set("thresholdMaybe", event.target.value), style: numberInput })))),
      /* @__PURE__ */ h("div", { style: { display: "grid", gap: 10 } }, /* @__PURE__ */ h("span", { style: { ...muted, fontWeight: 600 } }, t("grouping")), /* @__PURE__ */ h("div", { style: row }, /* @__PURE__ */ h("label", { style: label }, t("burstSeconds"), /* @__PURE__ */ h("input", { value: form.groupBurstSeconds, onChange: (event) => set("groupBurstSeconds", event.target.value), style: numberInput })), /* @__PURE__ */ h("label", { style: label }, t("burstHamming"), /* @__PURE__ */ h("input", { value: form.groupBurstHamming, onChange: (event) => set("groupBurstHamming", event.target.value), style: numberInput }))), /* @__PURE__ */ h("div", { style: row }, /* @__PURE__ */ h("label", { style: label }, t("sceneSeconds"), /* @__PURE__ */ h("input", { value: form.groupSceneSeconds, onChange: (event) => set("groupSceneSeconds", event.target.value), style: numberInput })), /* @__PURE__ */ h("label", { style: label }, t("sceneHamming"), /* @__PURE__ */ h("input", { value: form.groupSceneHamming, onChange: (event) => set("groupSceneHamming", event.target.value), style: numberInput })))),
      /* @__PURE__ */ h("div", { style: { display: "grid", gap: 6 } }, /* @__PURE__ */ h("span", { style: { ...muted, fontWeight: 600 } }, t("runOptions")), /* @__PURE__ */ h("label", { style: { display: "flex", gap: 6, alignItems: "center", fontSize: 13 } }, /* @__PURE__ */ h("input", { type: "checkbox", checked: form.stagePause, onChange: (event) => set("stagePause", event.target.checked) }), t("stagePause")), /* @__PURE__ */ h("label", { style: { display: "flex", gap: 6, alignItems: "center", fontSize: 13 } }, /* @__PURE__ */ h("input", { type: "checkbox", checked: form.offpeakOnly, onChange: (event) => set("offpeakOnly", event.target.checked) }), t("offpeak"))),
      prompt !== null && /* @__PURE__ */ h("div", { style: { display: "grid", gap: 6 } }, /* @__PURE__ */ h("span", { style: { ...muted, fontWeight: 600 } }, t("promptSection"), " \xB7 ", prompt.version), /* @__PURE__ */ h("details", null, /* @__PURE__ */ h("summary", { style: { cursor: "pointer", fontSize: 12 } }, t("viewPrompt")), /* @__PURE__ */ h("pre", { style: { whiteSpace: "pre-wrap", fontSize: 11, lineHeight: 1.5, background: "var(--dsw-alias-bg-layer-2)", padding: 10, borderRadius: 8, marginTop: 6 } }, prompt.prompts.gridUser, "\n\n---\n\n", prompt.prompts.rankUser, "\n\n---\n\n", prompt.prompts.scoreUser))),
      /* @__PURE__ */ h("div", { style: { display: "grid", gap: 6 } }, /* @__PURE__ */ h("span", { style: { ...muted, fontWeight: 600 } }, t("rerunStages")), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, ["preprocess", "grid", "rank", "score"].map((stage) => /* @__PURE__ */ h("button", { key: stage, type: "button", style: btn, onClick: () => onRunStage?.(stage) }, t("rerun"), " ", stageLabel(t, stage))))),
      /* @__PURE__ */ h("div", { style: { ...muted, fontSize: 12 } }, t("settingsHint")),
      error !== null && /* @__PURE__ */ h("div", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)", fontSize: 12 } }, error),
      /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ h("button", { type: "button", style: btnPrimary, disabled: busy, onClick: save }, t("save")), saved && /* @__PURE__ */ h("span", { style: { ...muted, fontSize: 12 } }, t("saved")))
    )
  );
}
function ProjectDetail({ t, id }) {
  const [detail, setDetail] = (0, import_react.useState)(null);
  const [progress, setProgress] = (0, import_react.useState)(null);
  const [checkpoints, setCheckpoints] = (0, import_react.useState)([]);
  const [pipelineEvent, setPipelineEvent] = (0, import_react.useState)(null);
  const [exporting, setExporting] = (0, import_react.useState)(false);
  const [settingsOpen, setSettingsOpen] = (0, import_react.useState)(false);
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
      if (event.pipeline === true) setPipelineEvent(event);
      else if (event.stage !== void 0) setProgress(event);
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
  const runAll = async () => {
    try {
      setPipelineEvent({ stage: "pipeline", phase: "start" });
      await api(`/photo-picker/api/projects/${id}/actions`, {
        method: "POST",
        body: JSON.stringify({ action: "run_all" })
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
  return /* @__PURE__ */ h("div", { style: { display: "grid", gap: 16 } }, /* @__PURE__ */ h("div", { style: { display: "grid", gap: 6 } }, /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ h("strong", { style: { fontSize: 16 } }, detail.name), /* @__PURE__ */ h("span", { style: chip }, statusLabel(t, detail.status)), /* @__PURE__ */ h("span", { style: muted }, detail.sourcePath)), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, Object.entries(counts).map(([state, count]) => /* @__PURE__ */ h("span", { key: state, style: chip }, stateLabel(t, state), ": ", String(count))), /* @__PURE__ */ h("span", { style: chip }, t("spent"), ": \xA5", Number(detail.cost?.spentCny ?? 0).toFixed(4), " / \xA5", Number(detail.cost?.budgetCny ?? 0).toFixed(0)), detail.running !== null && /* @__PURE__ */ h("span", { style: { ...chip, color: "var(--dsw-alias-brand-primary)" } }, t("running"), ": ", detail.running))), /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => run("scan") }, t("scan")), /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => run("preprocess") }, t("preprocess")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: aiDisabled, onClick: () => run("grid") }, t("stageGrid")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: aiDisabled, onClick: () => run("rank") }, t("stageRank")), /* @__PURE__ */ h("button", { type: "button", style: btn, disabled: aiDisabled, onClick: () => run("score") }, t("stageScore")), detail.running !== null && /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => run(detail.running, "pause") }, t("pause")), /* @__PURE__ */ h("button", { type: "button", style: btnPrimary, disabled: detail.running !== null, onClick: runAll }, t("autoRun")), /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => setExporting(true) }, t("export")), /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => setSettingsOpen(true) }, t("settings"))), exporting && /* @__PURE__ */ h(ExportDialog, { t, projectId: id, onClose: () => setExporting(false) }), settingsOpen && detail !== null && /* @__PURE__ */ h(
    SettingsDrawer,
    {
      t,
      detail: { ...detail, id },
      onClose: () => setSettingsOpen(false),
      onSaved: refresh,
      onRunStage: (stage) => run(stage)
    }
  ), aiDisabled && /* @__PURE__ */ h("div", { style: muted }, t("aiDisabled")), progress !== null && /* @__PURE__ */ h("div", { style: { display: "grid", gap: 4 } }, /* @__PURE__ */ h("div", { style: muted }, stageLabel(t, progress.stage), " ", progress.done ?? 0, "/", progress.total ?? "?", progress.costCny !== void 0 ? ` \xB7 \xA5${Number(progress.costCny).toFixed(4)}` : "", progress.error !== void 0 && progress.error !== null ? ` \xB7 ${String(progress.error)}` : ""), /* @__PURE__ */ h("div", { style: { height: 4, borderRadius: 2, background: "var(--dsw-alias-bg-layer-2)", overflow: "hidden" } }, /* @__PURE__ */ h("div", { style: { height: "100%", width: `${percent}%`, background: "var(--dsw-alias-brand-primary)" } }))), pipelineEvent !== null && /* @__PURE__ */ h("div", { style: muted }, pipelineEvent.error !== void 0 ? `${t("pipelineFailed")}: ${pipelineEvent.error}` : pipelineEvent.stage === "pipeline" && pipelineEvent.result !== void 0 ? `${pipelineEvent.result.reason === "paused" ? t("pipelinePaused") : t("pipelineDone")}: ${(pipelineEvent.result.completed ?? []).join(" \u2192 ")}${pipelineEvent.result.stoppedAt !== null && pipelineEvent.result.stoppedAt !== void 0 ? ` \xB7 ${t("nextStage")} ${stageLabel(t, pipelineEvent.result.stoppedAt)}` : ""}` : `${t("autoRun")}: ${stageLabel(t, pipelineEvent.stage)} \xB7 ${phaseLabel(t, pipelineEvent.phase)}`), error !== null && /* @__PURE__ */ h("div", { style: { color: "var(--dsw-alias-state-danger-primary, #d0453a)", fontSize: 12 } }, error), checkpoints.length > 0 && /* @__PURE__ */ h("div", { style: { display: "grid", gap: 8 } }, /* @__PURE__ */ h("span", { style: { ...muted, fontWeight: 600 } }, t("checkpoint")), checkpoints.map((cp) => /* @__PURE__ */ h("div", { key: cp.stage, style: {
    border: "1px solid var(--dsw-alias-border-l1)",
    borderRadius: 10,
    padding: 12,
    display: "grid",
    gap: 8
  } }, /* @__PURE__ */ h("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ h("strong", null, stageLabel(t, cp.stage)), /* @__PURE__ */ h("span", { style: chip }, runStatusLabel(t, cp.status)), /* @__PURE__ */ h("span", { style: chip }, "\xA5", Number(cp.costCny ?? 0).toFixed(4)), /* @__PURE__ */ h("span", { style: { ...muted, marginLeft: "auto" } }, summarizeStats(t, cp.stats))), (cp.sampleIds ?? []).length > 0 && /* @__PURE__ */ h("div", { style: { display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6 } }, cp.sampleIds.map((pid) => /* @__PURE__ */ h(
    "img",
    {
      key: pid,
      src: `/photo-picker/media/thumb/${id}/${pid}?v=${version}`,
      alt: pid,
      style: { width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 6, background: "var(--dsw-alias-bg-layer-2)" }
    }
  )))))), /* @__PURE__ */ h(ReviewSection, { t, projectId: id, version, onChanged: refresh }), /* @__PURE__ */ h(CalibrationSection, { t, projectId: id, onApplied: refresh }));
}
function Workbench({ t }) {
  (0, import_react.useSyncExternalStore)(subscribeLanguage, getLanguage);
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
  } }, /* @__PURE__ */ h("div", { style: { maxWidth: 960, margin: "0 auto", padding: "0 clamp(24px, 4vw, 48px) 48px" } }, /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center", gap: 12, paddingTop: 28, marginBottom: 24 } }, /* @__PURE__ */ h("div", { style: { display: "grid", gap: 2 } }, /* @__PURE__ */ h("h1", { style: { margin: 0, fontSize: 20, fontWeight: 600 } }, t("title")), /* @__PURE__ */ h("span", { style: muted }, t("subtitle"))), /* @__PURE__ */ h("div", { style: { marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ h(
    "button",
    {
      type: "button",
      style: { ...btn, padding: "5px 10px", fontSize: 12 },
      title: t("language"),
      onClick: () => setLanguage(getLanguage() === "zh" ? "en" : "zh")
    },
    getLanguage() === "zh" ? "EN" : "\u4E2D"
  ), selected !== null && /* @__PURE__ */ h("button", { type: "button", style: btn, onClick: () => setSelected(null) }, t("back")), /* @__PURE__ */ h("button", { type: "button", style: selected !== null ? btn : btnPrimary, onClick: () => {
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
    /* @__PURE__ */ h("span", { style: muted }, project.sourcePath, " \xB7 ", Object.entries(project.counts ?? {}).map(([state, n]) => `${stateLabel(t, state)} ${String(n)}`).join("  "))
  )))));
}
function PhotoPickerIcon({ size }) {
  const edge = size ?? 16;
  return /* @__PURE__ */ h("svg", { width: edge, height: edge, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", style: { display: "block" } }, /* @__PURE__ */ h("circle", { cx: "12", cy: "12", r: "8.4", stroke: "currentColor", strokeWidth: "1.6" }), /* @__PURE__ */ h("path", { d: "M12 3.9 16.15 8.3l-1.55 5.25h-5.2L7.85 8.3 12 3.9Z", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" }), /* @__PURE__ */ h("circle", { cx: "12", cy: "12", r: "2.6", stroke: "currentColor", strokeWidth: "1.4" }));
}
var inject = ["slots", "locale"];
function apply(ctx) {
  const t = (key) => translate(getLanguage(), key);
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "photo-picker.locale");
  ctx.slots.inject("main", () => ctx.slots.register(
    { name: "main", key: PANEL_ID },
    () => /* @__PURE__ */ h(Workbench, { t })
  ));
  ctx.slots.inject("sidebar.panellist", () => ctx.slots.register(
    { name: "sidebar.panellist", id: PANEL_ID, order: 20, label: () => t("title") },
    PhotoPickerIcon
  ));
}

    return module.exports;
  },
});
