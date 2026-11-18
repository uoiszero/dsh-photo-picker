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
var import_react2 = __toESM(require("react"), 1);

// plugin/src/client/locales.js
var zh = {
  title: "\u7167\u7247\u5DE5\u4F5C\u53F0",
  subtitle: "\u9009\u62E9\u672C\u673A\u7167\u7247\u6587\u4EF6\u5939\uFF0C\u626B\u63CF\u5E76\u505A\u672C\u5730\u9884\u5904\u7406\uFF08\u53BB\u91CD / \u6280\u672F\u8FC7\u6EE4 / \u5206\u7EC4\uFF09\u3002",
  newProject: "\u65B0\u5EFA\u9879\u76EE",
  sourceType: "\u7167\u7247\u6E90",
  sourceLocal: "\u672C\u673A\u76EE\u5F55",
  sourceSmb: "SMB \u7F51\u7EDC\u5171\u4EAB",
  smbUnavailable: "\u6682\u4E0D\u53EF\u7528",
  smbUrl: "SMB \u5730\u5740",
  smbConnect: "\u8FDE\u63A5 SMB",
  smbConnecting: "\u6B63\u5728\u7B49\u5F85\u7CFB\u7EDF\u767B\u5F55/\u6302\u8F7D\u2026",
  smbConnected: "\u5DF2\u6302\u8F7D",
  smbHint: "\u4F8B\u5982 smb://192.168.12.199/yueao\uFF1B\u5BC6\u7801\u7531\u7CFB\u7EDF\u94A5\u5319\u4E32\u4FDD\u5B58\uFF0C\u63D2\u4EF6\u4E0D\u4FDD\u5B58\u3002",
  networkOffline: "\u7F51\u7EDC\u6E90\u5DF2\u65AD\u5F00",
  folder: "\u7167\u7247\u6587\u4EF6\u5939",
  choose: "\u7528\u7CFB\u7EDF\u5BF9\u8BDD\u6846\u9009\u62E9",
  choosingFolder: "\u6B63\u5728\u9009\u62E9\u2026",
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
  loadMore: "\u7EE7\u7EED\u6EDA\u52A8\u52A0\u8F7D\u66F4\u591A",
  retry: "\u91CD\u8BD5",
  errorTitle: "\u51FA\u9519\u4E86",
  themeMixed: "\u6DF7\u5408",
  themePortrait: "\u4EBA\u50CF",
  themeLandscape: "\u98CE\u5149",
  themeEvent: "\u6D3B\u52A8",
  scenePortrait: "\u4EBA\u50CF",
  sceneLandscape: "\u98CE\u5149",
  sceneArchitecture: "\u5EFA\u7B51",
  sceneStreet: "\u8857\u62CD",
  sceneEvent: "\u6D3B\u52A8",
  sceneFlower: "\u82B1/\u690D\u7269",
  sceneWildlife: "\u52A8\u7269",
  sceneSculpture: "\u96D5\u5851/\u5C55\u54C1",
  sceneOther: "\u5176\u4ED6",
  editScenes: "\u7F16\u8F91\u573A\u666F",
  deleteProject: "\u5220\u9664",
  deleteProjectConfirm: "\u786E\u5B9A\u5220\u9664\u9879\u76EE\u201C{name}\u201D\u5417\uFF1F\u5C06\u5220\u9664\u672C\u5730\u5DE5\u4F5C\u533A\u3001\u6570\u636E\u5E93\u548C\u7F29\u7565\u56FE\uFF0C\u6E90\u7167\u7247\u4E0D\u4F1A\u88AB\u5220\u9664\u3002",
  primaryScene: "\u4E3B\u573A\u666F",
  sceneEditHint: "\u52FE\u9009 1\u20133 \u4E2A\u573A\u666F\uFF0C\u4E3B\u573A\u666F\u51B3\u5B9A\u8BC4\u5206\u91CD\u70B9\uFF1B\u4E0D\u52FE\u9009\u4EFB\u4F55\u573A\u666F\u4F1A\u6062\u590D AI \u6807\u7B7E\u3002",
  sceneSourceHuman: "\u5F53\u524D\u4F7F\u7528\u4EBA\u5DE5\u573A\u666F\u6807\u7B7E",
  sceneSourceAi: "\u5F53\u524D\u4F7F\u7528 AI \u573A\u666F\u6807\u7B7E",
  resetScenes: "\u6062\u590D AI \u6807\u7B7E",
  cancel: "\u53D6\u6D88",
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
  sortLabel: "\u6392\u5E8F",
  sceneFilter: "\u573A\u666F",
  clearFilters: "\u6E05\u9664\u7B5B\u9009",
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
  singleStep: "\u5355\u6B65\u8FD0\u884C",
  autoDoneToast: "\u81EA\u52A8\u8DD1\u5B8C\u6210\uFF1A{stages}",
  autoPausedToast: "\u81EA\u52A8\u8DD1\u5DF2\u6682\u505C\uFF1A\u5DF2\u5B8C\u6210 {stages}\uFF0C\u4E0B\u4E00\u9636\u6BB5 {next}",
  autoFailedToast: "\u81EA\u52A8\u8DD1\u5931\u8D25\uFF1A{error}",
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
  editRecipe: "\u4FEE\u56FE\u5EFA\u8BAE",
  editNoRecipe: "\u8FD9\u5F20\u7167\u7247\u6CA1\u6709\u7ED3\u6784\u5316\u4FEE\u56FE\u5EFA\u8BAE\uFF1B\u91CD\u8DD1\u5355\u5F20\u7CBE\u8BC4\u53EF\u751F\u6210\u3002",
  editBefore: "\u539F\u56FE",
  editAfter: "\u4FEE\u56FE",
  editToggleHint: "\u70B9\u51FB\u5207\u6362\u539F\u56FE/\u4FEE\u56FE",
  gridGuide: "\u4E5D\u5BAB\u683C",
  crossGuide: "\u5341\u5B57\u7EBF",
  editCrop: "\u88C1\u526A",
  editCropKeep: "\u4FDD\u7559",
  editCropLeft: "\u5DE6",
  editCropTop: "\u4E0A",
  editCropNone: "\u672A\u88C1\u5207",
  editRotate: "\u6821\u6B63",
  editExposure: "\u66DD\u5149",
  editContrast: "\u5BF9\u6BD4",
  editSaturation: "\u9971\u548C",
  editSharpen: "\u9510\u5316",
  editExport: "\u5E94\u7528\u4FEE\u56FE\u5EFA\u8BAE\uFF08\u8F93\u51FA JPEG \u526F\u672C\uFF09",
  editExportHint: "\u5E94\u7528\u4FEE\u56FE\u65F6\u5F3A\u5236\u590D\u5236\uFF0C\u6E90\u6587\u4EF6\u4E0D\u4F1A\u4FEE\u6539\uFF1B\u6CA1\u6709\u914D\u65B9\u7684\u7167\u7247\u4FDD\u6301\u539F\u6837\u590D\u5236\u3002",
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
  saveScenes: "\u4FDD\u5B58",
  saved: "\u5DF2\u4FDD\u5B58",
  settingsHint: "\u9608\u503C\u3001\u5206\u7EC4\u53C2\u6570\u4E0E\u63D0\u793A\u8BCD\u6539\u52A8\u5F71\u54CD\u540E\u7EED\u9636\u6BB5\uFF1B\u5206\u7EC4\u53C2\u6570\u9700\u8981\u91CD\u8DD1\u9884\u5904\u7406\u624D\u751F\u6548\u3002",
  sceneRescoreHint: "\u6CE8\u610F\uFF1A\u91CD\u8DD1\u5355\u5F20\u7CBE\u8BC4\u4F1A\u7528 v7 \u63D0\u793A\u8BCD\u91CD\u65B0\u8BC4\u5206\u5DF2\u8BC4\u8FC7\u7684\u7167\u7247\uFF0C\u5E76\u4EA7\u751F\u8D39\u7528\u3002",
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
  history: "\u8FD0\u884C\u8BB0\u5F55",
  samples: "\u62BD\u6837",
  clearSelection: "\u6E05\u7A7A",
  reviewEmpty: "\u6CA1\u6709\u7B26\u5408\u5F53\u524D\u7B5B\u9009\u7684\u7167\u7247",
  namePlaceholder: "2024 \u5A5A\u793C",
  destPlaceholder: "/Volumes/\u2026/\u7CBE\u9009",
  groupRank: "\u7EC4\u5185\u7B2C {rank}/{size}",
  nextStage: "\u4E0B\u4E00\u9636\u6BB5",
  previousPage: "\u4E0A\u4E00\u9875",
  nextPage: "\u4E0B\u4E00\u9875",
  previousGroup: "\u4E0A\u4E00\u7EC4",
  nextGroup: "\u4E0B\u4E00\u7EC4"
};
var en = {
  title: "Photo Picker",
  subtitle: "Pick a local photo folder, scan it, then run local preprocess (dedupe / technical filters / grouping).",
  newProject: "New project",
  sourceType: "Photo source",
  sourceLocal: "Local folder",
  sourceSmb: "SMB share",
  smbUnavailable: "unavailable",
  smbUrl: "SMB address",
  smbConnect: "Connect SMB",
  smbConnecting: "Waiting for system login/mount\u2026",
  smbConnected: "Mounted",
  smbHint: "e.g. smb://192.168.12.199/yueao; the password is stored by the system keychain, not the plugin.",
  networkOffline: "Network source disconnected",
  folder: "Photo folder",
  choose: "Choose with system dialog",
  choosingFolder: "Choosing\u2026",
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
  loadMore: "Scroll for more",
  retry: "Retry",
  errorTitle: "Something went wrong",
  themeMixed: "Mixed",
  themePortrait: "Portrait",
  themeLandscape: "Landscape",
  themeEvent: "Event",
  scenePortrait: "Portrait",
  sceneLandscape: "Landscape",
  sceneArchitecture: "Architecture",
  sceneStreet: "Street",
  sceneEvent: "Event",
  sceneFlower: "Flower",
  sceneWildlife: "Wildlife",
  sceneSculpture: "Sculpture",
  sceneOther: "Other",
  editScenes: "Edit scenes",
  deleteProject: "Delete",
  deleteProjectConfirm: "Delete project \u201C{name}\u201D? This removes its local workspace, database and thumbnails; source photos are untouched.",
  primaryScene: "Primary scene",
  sceneEditHint: "Select 1\u20133 scenes; the primary scene drives scoring. Clearing all restores AI tags.",
  sceneSourceHuman: "Using manual scene tags",
  sceneSourceAi: "Using AI scene tags",
  resetScenes: "Restore AI tags",
  cancel: "Cancel",
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
  sortLabel: "Sort",
  sceneFilter: "Scene",
  clearFilters: "Clear filters",
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
  singleStep: "Single steps",
  autoDoneToast: "Auto run finished: {stages}",
  autoPausedToast: "Auto run paused after {stages}; next stage {next}",
  autoFailedToast: "Auto run failed: {error}",
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
  editRecipe: "Edit recipe",
  editNoRecipe: "No structured edit recipe for this photo; re-run single scoring to generate one.",
  editBefore: "Before",
  editAfter: "After",
  editToggleHint: "Click to switch original/edited",
  gridGuide: "Rule of thirds",
  crossGuide: "Crosshair",
  editCrop: "Crop",
  editCropKeep: "Keep",
  editCropLeft: "Left",
  editCropTop: "Top",
  editCropNone: "Uncropped",
  editRotate: "Straighten",
  editExposure: "Exposure",
  editContrast: "Contrast",
  editSaturation: "Saturation",
  editSharpen: "Sharpen",
  editExport: "Apply edit recipes (JPEG copies)",
  editExportHint: "Applying edits forces copy mode; source files are never modified. Photos without a recipe are copied unchanged.",
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
  saveScenes: "Save",
  saved: "Saved",
  settingsHint: "Thresholds, grouping and prompt changes affect later stages; grouping needs a preprocess re-run.",
  sceneRescoreHint: "Note: rerunning single-photo scoring will rescore already-scored photos with the v7 prompt and incur cost.",
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
  history: "Run history",
  samples: "Samples",
  clearSelection: "Clear",
  reviewEmpty: "No photos match this filter",
  namePlaceholder: "2024 wedding",
  destPlaceholder: "/Volumes/\u2026/selects",
  groupRank: "rank {rank}/{size} in group",
  nextStage: "next stage",
  previousPage: "Previous page",
  nextPage: "Next page",
  previousGroup: "Previous group",
  nextGroup: "Next group"
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

// plugin/src/client/theme.js
var STYLES = `
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
.pp-scene-options { display: flex; flex-wrap: wrap; gap: 8px 14px; }
.pp-scene-options label { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; }
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
.pp-project-wrap .pp-project { padding-right: 78px; }
.pp-project-delete { position: absolute; top: 12px; right: 44px; z-index: 1; }
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
.pp-history > summary::after { content: '\u2304'; margin-left: auto; color: var(--dsw-alias-label-secondary); transition: transform .15s; }
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
.pp-project-wrap .pp-project { padding-right: 78px; }
.pp-project-delete { position: absolute; top: 12px; right: 44px; z-index: 1; }
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
@media (prefers-reduced-motion: reduce) {
  .pp-page *, .pp-page *::before, .pp-page *::after {
    animation: none !important; transition: none !important;
  }
}
`;
function installStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("dsh-photo-picker-styles") !== null) return;
  const style = document.createElement("style");
  style.id = "dsh-photo-picker-styles";
  style.textContent = STYLES;
  document.head.appendChild(style);
}

// plugin/src/client/virtual.js
var TILE_GAP = 10;
var TILE_MIN = 158;
var TILE_MIN_NARROW = 128;
function computeColumns(width, minTile = TILE_MIN, gap = TILE_GAP) {
  const available = Number(width);
  if (!Number.isFinite(available) || available <= 0) return 1;
  return Math.max(1, Math.floor((available + gap) / (minTile + gap)));
}
function computeRowHeight(width, columns, gap = TILE_GAP) {
  if (!Number.isFinite(width) || width <= 0 || columns <= 0) return 0;
  const tileWidth = (width - gap * (columns - 1)) / columns;
  return Math.max(0, tileWidth + gap);
}
function computeVisibleRows({
  scrollTop,
  wallTop,
  rowHeight,
  totalRows,
  viewportHeight,
  overscan = 2
}) {
  if (!Number.isFinite(rowHeight) || rowHeight <= 0 || totalRows <= 0) {
    return { start: 0, end: 0 };
  }
  const first = Math.floor((Number(scrollTop) - Number(wallTop)) / rowHeight);
  const visible = Math.ceil(Math.max(0, Number(viewportHeight)) / rowHeight);
  const start = Math.min(totalRows, Math.max(0, first - overscan));
  const end = Math.min(totalRows, Math.max(0, first) + visible + overscan);
  return { start, end: Math.max(start, end) };
}

// plugin/src/client/ui.tsx
var import_react = __toESM(require("react"), 1);
var h = import_react.default.createElement;
var Fragment = import_react.default.Fragment;
function Button({
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}) {
  const classes = [
    "pp-button",
    variant !== "secondary" ? `pp-button-${variant}` : "",
    size === "sm" ? "pp-button-sm" : "",
    className
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ h("button", { type: "button", className: classes, ...props });
}
function BackButton({ label, onClick }) {
  return /* @__PURE__ */ h("button", { type: "button", className: "pp-back", onClick }, /* @__PURE__ */ h("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" }, /* @__PURE__ */ h("path", { d: "M10.5 3.5 6 8l4.5 4.5", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" })), /* @__PURE__ */ h("span", null, label));
}
function CloseButton({ label, onClick }) {
  return /* @__PURE__ */ h("button", { type: "button", className: "pp-close", "aria-label": label, title: label, onClick }, /* @__PURE__ */ h("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" }, /* @__PURE__ */ h("path", { d: "m4 4 8 8M12 4l-8 8", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round" })));
}
function Segmented({ label, items, value, onChange }) {
  return /* @__PURE__ */ h("div", { className: "pp-seg", role: "group", "aria-label": label }, items.map((item) => /* @__PURE__ */ h(
    "button",
    {
      key: item.value,
      type: "button",
      className: value === item.value ? "active" : "",
      "aria-pressed": value === item.value,
      onClick: () => onChange(item.value)
    },
    item.label
  )));
}
function Tabs({ label, items, value, onChange }) {
  return /* @__PURE__ */ h("div", { className: "pp-tabs", role: "tablist", "aria-label": label }, items.map((item) => /* @__PURE__ */ h(
    "button",
    {
      key: item.value,
      type: "button",
      role: "tab",
      className: "pp-tab",
      "aria-selected": value === item.value,
      disabled: item.disabled === true,
      title: item.title,
      onClick: () => {
        if (item.disabled !== true) onChange(item.value);
      }
    },
    item.label
  )));
}
function Field({ label, help, children, className = "", as = "label" }) {
  const Tag = as;
  return /* @__PURE__ */ h(Tag, { className: `pp-field ${className}`.trim() }, /* @__PURE__ */ h("span", null, label), children, help !== void 0 && /* @__PURE__ */ h("span", { className: "pp-field-help" }, help));
}
function Input(props) {
  return /* @__PURE__ */ h("input", { className: "pp-input", ...props });
}
function Select(props) {
  const { compact = false, className = "", ...rest } = props;
  return /* @__PURE__ */ h("select", { className: `pp-select${compact ? " pp-select-sm" : ""} ${className}`.trim(), ...rest });
}
function StateCard({ kind, title, message, action }) {
  return /* @__PURE__ */ h("div", { className: `pp-state pp-state-${kind}`, role: kind === "error" ? "alert" : void 0 }, /* @__PURE__ */ h("span", { className: "pp-state-icon", "aria-hidden": "true" }, kind === "loading" ? /* @__PURE__ */ h("span", { className: "pp-spinner" }) : kind === "error" ? "!" : "\u2014"), /* @__PURE__ */ h("span", { className: "pp-state-copy" }, /* @__PURE__ */ h("strong", null, title), message !== void 0 && message !== null && message !== "" && /* @__PURE__ */ h("span", null, message)), action);
}
function Card({ className = "", children, ...props }) {
  return /* @__PURE__ */ h("div", { className: `pp-card ${className}`.trim(), ...props }, children);
}
function ModalShell({ title, closeLabel, onClose, children, className = "" }) {
  return /* @__PURE__ */ h("div", { className: "pp-overlay", onClick: onClose }, /* @__PURE__ */ h("div", { className: `pp-modal ${className}`.trim(), onClick: (event) => event.stopPropagation() }, /* @__PURE__ */ h("div", { className: "pp-modal-head" }, /* @__PURE__ */ h("span", null, title), /* @__PURE__ */ h(CloseButton, { label: closeLabel, onClick: onClose })), children));
}
function DrawerShell({ title, closeLabel, onClose, children }) {
  return /* @__PURE__ */ h("div", { className: "pp-drawer-scrim", onClick: onClose }, /* @__PURE__ */ h("div", { className: "pp-drawer", onClick: (event) => event.stopPropagation() }, /* @__PURE__ */ h("div", { className: "pp-modal-head" }, /* @__PURE__ */ h("span", null, title), /* @__PURE__ */ h(CloseButton, { label: closeLabel, onClick: onClose })), children));
}
function ActionBar({ children, end = false }) {
  return /* @__PURE__ */ h("div", { className: `pp-actions${end ? " pp-actions-right" : ""}` }, children);
}

// plugin/src/client/index.tsx
var h2 = import_react2.default.createElement;
var Fragment2 = import_react2.default.Fragment;
var NS = "photoPicker";
var PANEL_ID = "photo-picker";
var SMB_ENABLED = false;
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
var SCENE_KEYS = {
  portrait: "scenePortrait",
  landscape: "sceneLandscape",
  architecture: "sceneArchitecture",
  street: "sceneStreet",
  event: "sceneEvent",
  flower: "sceneFlower",
  wildlife: "sceneWildlife",
  sculpture: "sceneSculpture",
  other: "sceneOther"
};
function sceneLabel(t, scene) {
  return SCENE_KEYS[scene] === void 0 ? scene : t(SCENE_KEYS[scene]);
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
  const [sourceKind, setSourceKind] = (0, import_react2.useState)("local");
  const [smbUrl, setSmbUrl] = (0, import_react2.useState)("");
  const [mountPoint, setMountPoint] = (0, import_react2.useState)("");
  const [connecting, setConnecting] = (0, import_react2.useState)(false);
  const [folder, setFolder] = (0, import_react2.useState)("");
  const [dirs, setDirs] = (0, import_react2.useState)([]);
  const [name, setName] = (0, import_react2.useState)("");
  const [budget, setBudget] = (0, import_react2.useState)("30");
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [choosing, setChoosing] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)(null);
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
    if (choosing) return;
    setChoosing(true);
    try {
      const result = await api("/photo-picker/api/fs/choose", { method: "POST" });
      setFolder(result.path);
      setError(null);
    } catch (cause) {
      setError(String(cause));
    } finally {
      setChoosing(false);
    }
  };
  const connectSmb = async () => {
    if (connecting) return;
    setConnecting(true);
    setError(null);
    try {
      const connected = await api("/photo-picker/api/fs/smb/connect", {
        method: "POST",
        body: JSON.stringify({ url: smbUrl })
      });
      setMountPoint(connected.mountPoint);
      setFolder(connected.sourcePath ?? connected.mountPoint);
    } catch (cause) {
      setError(String(cause));
    } finally {
      setConnecting(false);
    }
  };
  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const source = sourceKind === "smb" ? { kind: "smb", path: folder || mountPoint, mountPoint, url: smbUrl } : { kind: "local", path: folder };
      const project = await api("/photo-picker/api/projects", {
        method: "POST",
        body: JSON.stringify({
          source,
          name: name === "" ? void 0 : name,
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
  return /* @__PURE__ */ h2("div", { className: "pp-card pp-panel", style: { maxWidth: 700 } }, /* @__PURE__ */ h2("div", { className: "pp-form" }, /* @__PURE__ */ h2("div", { className: "pp-page-nav" }, /* @__PURE__ */ h2(BackButton, { label: t("back"), onClick: onCancel })), /* @__PURE__ */ h2(Field, { as: "div", label: t("sourceType") }, /* @__PURE__ */ h2(
    Tabs,
    {
      label: t("sourceType"),
      value: sourceKind,
      items: [
        { value: "local", label: t("sourceLocal") },
        {
          value: "smb",
          label: `${t("sourceSmb")}${SMB_ENABLED ? "" : ` \xB7 ${t("smbUnavailable")}`}`,
          disabled: !SMB_ENABLED,
          title: SMB_ENABLED ? void 0 : t("smbUnavailable")
        }
      ],
      onChange: (value) => {
        if (value === "local") setMountPoint("");
        setSourceKind(value);
        setError(null);
      }
    }
  )), sourceKind === "local" ? /* @__PURE__ */ h2(Fragment2, null, /* @__PURE__ */ h2(Field, { as: "div", label: t("folder") }, /* @__PURE__ */ h2("div", { className: "pp-row", style: { alignItems: "stretch" } }, /* @__PURE__ */ h2(
    Input,
    {
      value: folder,
      onChange: (event) => setFolder(event.target.value),
      placeholder: "/Users/\u2026/Pictures",
      "aria-label": t("folder"),
      style: { flex: 1 }
    }
  ), /* @__PURE__ */ h2(Button, { disabled: choosing, onClick: choose }, choosing ? t("choosingFolder") : t("choose")), /* @__PURE__ */ h2(Button, { onClick: () => browse(folder) }, t("browse")))), dirs.length > 0 && /* @__PURE__ */ h2("div", { className: "pp-card pp-dir-list" }, dirs.map((dir) => /* @__PURE__ */ h2("button", { type: "button", className: "pp-dir-row", key: dir.path, onClick: () => browse(dir.path) }, dir.name)))) : /* @__PURE__ */ h2(Field, { as: "div", label: t("smbUrl"), help: t("smbHint") }, /* @__PURE__ */ h2("div", { className: "pp-row", style: { alignItems: "stretch" } }, /* @__PURE__ */ h2(
    Input,
    {
      value: smbUrl,
      onChange: (event) => {
        setSmbUrl(event.target.value);
        setMountPoint("");
        setError(null);
      },
      placeholder: "smb://192.168.12.199/yueao",
      "aria-label": t("smbUrl"),
      style: { flex: 1 }
    }
  ), /* @__PURE__ */ h2(Button, { disabled: connecting || smbUrl === "", onClick: connectSmb }, connecting ? t("smbConnecting") : t("smbConnect"))), mountPoint !== "" && /* @__PURE__ */ h2("span", { className: "pp-field-help" }, t("smbConnected"), ": ", mountPoint)), /* @__PURE__ */ h2(Field, { label: t("name") }, /* @__PURE__ */ h2(Input, { value: name, onChange: (event) => setName(event.target.value), placeholder: t("namePlaceholder") })), /* @__PURE__ */ h2(Field, { label: t("budget"), className: "pp-field-narrow" }, /* @__PURE__ */ h2(Input, { value: budget, onChange: (event) => setBudget(event.target.value) })), /* @__PURE__ */ h2(ActionBar, { end: true }, /* @__PURE__ */ h2(Button, { variant: "primary", disabled: busy || (sourceKind === "local" ? folder === "" : mountPoint === ""), onClick: create }, busy ? t("creating") : t("create"))), error !== null && /* @__PURE__ */ h2(StateCard, { kind: "error", title: t("errorTitle"), message: error })));
}
var VERDICT_COLORS = {
  keep: "var(--pp-status-keep)",
  maybe: "var(--pp-status-maybe)",
  reject: "var(--pp-status-reject)"
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
  const PAGE_SIZE = 200;
  const [items, setItems] = (0, import_react2.useState)([]);
  const [total, setTotal] = (0, import_react2.useState)(0);
  const [nextOffset, setNextOffset] = (0, import_react2.useState)(0);
  const [hasMore, setHasMore] = (0, import_react2.useState)(false);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [loadingMore, setLoadingMore] = (0, import_react2.useState)(false);
  const [filter, setFilter] = (0, import_react2.useState)("all");
  const [scene, setScene] = (0, import_react2.useState)("all");
  const [sort, setSort] = (0, import_react2.useState)("score");
  const [selected, setSelected] = (0, import_react2.useState)([]);
  const [undo, setUndo] = (0, import_react2.useState)([]);
  const [single, setSingle] = (0, import_react2.useState)(null);
  const [groupView, setGroupView] = (0, import_react2.useState)(null);
  const [error, setError] = (0, import_react2.useState)(null);
  const itemsRef = (0, import_react2.useRef)([]);
  const requestRef = (0, import_react2.useRef)(0);
  const wallRef = (0, import_react2.useRef)(null);
  const sentinelRef = (0, import_react2.useRef)(null);
  const [wallWidth, setWallWidth] = (0, import_react2.useState)(0);
  const [visibleRange, setVisibleRange] = (0, import_react2.useState)({ start: 0, end: 20 });
  const filterKey = `${filter}|${scene}|${sort}`;
  const lastFilterKey = (0, import_react2.useRef)("");
  const fetchPage = async (offset) => {
    const params = new URLSearchParams({ scope: "review", sort, limit: String(PAGE_SIZE), offset: String(offset) });
    if (filter !== "all") params.set("verdict", filter);
    if (scene !== "all") params.set("scene", scene);
    return api(`/photo-picker/api/projects/${projectId}/photos?${params.toString()}`);
  };
  const applyItems = (next, count) => {
    itemsRef.current = next;
    setItems(next);
    setTotal(count);
    setNextOffset(next.length);
    setHasMore(next.length < count);
  };
  const loadPage = async (offset, append) => {
    const generation = ++requestRef.current;
    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setSelected([]);
    }
    try {
      const data = await fetchPage(offset);
      if (generation !== requestRef.current) return;
      const seen = /* @__PURE__ */ new Set();
      const merged = [];
      for (const item of [...append ? itemsRef.current : [], ...data.items ?? []]) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      }
      applyItems(merged, Number(data.total ?? merged.length));
      setError(null);
    } catch (cause) {
      if (generation === requestRef.current) setError(String(cause));
    } finally {
      if (generation === requestRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };
  const refreshLoaded = async () => {
    const count = itemsRef.current.length;
    if (count === 0) {
      await loadPage(0, false);
      return;
    }
    const generation = ++requestRef.current;
    setLoadingMore(true);
    try {
      const pages = Math.ceil(count / PAGE_SIZE);
      const results = [];
      for (let page = 0; page < pages; page += 1) {
        const data = await fetchPage(page * PAGE_SIZE);
        if (generation !== requestRef.current) return;
        results.push(data);
      }
      const seen = /* @__PURE__ */ new Set();
      const merged = [];
      for (const data of results) {
        for (const item of data.items ?? []) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
      }
      applyItems(merged, Number(results[0]?.total ?? merged.length));
      setError(null);
    } catch (cause) {
      if (generation === requestRef.current) setError(String(cause));
    } finally {
      if (generation === requestRef.current) setLoadingMore(false);
    }
  };
  const loadMore = async () => {
    if (!hasMore || loading || loadingMore) return itemsRef.current;
    await loadPage(nextOffset, true);
    return itemsRef.current;
  };
  (0, import_react2.useEffect)(() => {
    const isFirst = lastFilterKey.current === "";
    const reset = isFirst || lastFilterKey.current !== filterKey;
    lastFilterKey.current = filterKey;
    if (reset) {
      void loadPage(0, false);
      wallRef.current?.scrollIntoView({ block: "start" });
    } else {
      void refreshLoaded();
    }
  }, [filter, scene, sort, version]);
  (0, import_react2.useEffect)(() => {
    if (!hasMore || loading || loadingMore || items.length === 0 || sentinelRef.current === null) return;
    const scrollRoot = wallRef.current?.closest(".pp-page");
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMore();
    }, { root: scrollRoot ?? null, rootMargin: "400px" });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, items.length, nextOffset, filter, scene, sort, wallWidth]);
  (0, import_react2.useEffect)(() => {
    const el = wallRef.current;
    if (el === null) return;
    const update = () => setWallWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length, single, groupView]);
  const narrow = typeof window !== "undefined" && window.matchMedia("(max-width: 880px)").matches;
  const columns = computeColumns(wallWidth, narrow ? TILE_MIN_NARROW : TILE_MIN, TILE_GAP);
  const rowHeight = computeRowHeight(wallWidth, columns, TILE_GAP);
  const totalRows = Math.ceil(items.length / columns);
  (0, import_react2.useEffect)(() => {
    const wall = wallRef.current;
    if (wall === null) return;
    const root = wall.closest(".pp-page");
    if (root === null) return;
    let frame = 0;
    const update = () => {
      const wallTop = wall.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
      const next = computeVisibleRows({
        scrollTop: root.scrollTop,
        wallTop,
        rowHeight,
        totalRows,
        viewportHeight: root.clientHeight,
        overscan: 2
      });
      setVisibleRange((current) => current.start === next.start && current.end === next.end ? current : next);
    };
    const onScroll = () => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [wallWidth, rowHeight, totalRows, items.length, single, groupView]);
  const markDecided = (photoIds, verdict) => {
    const ids = new Set(photoIds);
    setItems((current) => current.map((item) => {
      if (!ids.has(item.id)) return item;
      if (verdict === "auto") return { ...item, humanVerdict: null, verdict: item.aiVerdict ?? "maybe" };
      return { ...item, humanVerdict: verdict, verdict };
    }));
  };
  const decide = async (photoIds, verdict) => {
    if (photoIds.length === 0) return;
    const previous = {};
    for (const item of itemsRef.current) if (photoIds.includes(item.id)) previous[item.id] = item.humanVerdict;
    try {
      await api(`/photo-picker/api/projects/${projectId}/decisions`, {
        method: "POST",
        body: JSON.stringify({ photoIds, verdict })
      });
      setUndo((stack) => [{ previous }, ...stack].slice(0, 20));
      setSelected([]);
      markDecided(photoIds, verdict);
      onChanged?.();
    } catch (cause) {
      setError(String(cause));
    }
  };
  const undoLast = async () => {
    const entry = undo[0];
    if (entry === void 0) return;
    const groups = {};
    const previous = entry.previous;
    for (const [photoId, verdict] of Object.entries(previous)) {
      const key = verdict ?? "auto";
      groups[key] = [...groups[key] ?? [], photoId];
    }
    try {
      for (const [verdict, photoIds] of Object.entries(groups)) {
        await api(`/photo-picker/api/projects/${projectId}/decisions`, {
          method: "POST",
          body: JSON.stringify({ photoIds, verdict })
        });
        markDecided(photoIds, verdict);
      }
      setUndo((stack) => stack.slice(1));
      onChanged?.();
    } catch (cause) {
      setError(String(cause));
    }
  };
  const toggle = (photoId) => setSelected((current) => current.includes(photoId) ? current.filter((id) => id !== photoId) : [...current, photoId]);
  if (groupView !== null) {
    return /* @__PURE__ */ h2(
      GroupCompare,
      {
        t,
        projectId,
        groupId: groupView,
        version,
        onNavigate: setGroupView,
        onClose: () => setGroupView(null),
        onDecided: async () => {
          await refreshLoaded();
          onChanged?.();
        }
      }
    );
  }
  if (single !== null) {
    return /* @__PURE__ */ h2(
      PhotoSingle,
      {
        t,
        projectId,
        items,
        photoId: single,
        version,
        onNavigate: setSingle,
        onNeedMore: loadMore,
        onOpenGroup: setGroupView,
        onDecide: decide,
        onScenesUpdated: async () => {
          await refreshLoaded();
          onChanged?.();
        },
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
  return /* @__PURE__ */ h2("section", { className: "pp-review" }, /* @__PURE__ */ h2("div", { className: "pp-toolbar" }, /* @__PURE__ */ h2("div", { className: "pp-toolbar-group" }, /* @__PURE__ */ h2("span", { className: "pp-section-title" }, t("review")), /* @__PURE__ */ h2(
    Segmented,
    {
      label: t("review"),
      value: filter,
      items: filters.map(([value, label]) => ({ value, label })),
      onChange: setFilter
    }
  )), /* @__PURE__ */ h2("div", { className: "pp-toolbar-group pp-toolbar-end" }, /* @__PURE__ */ h2("label", { className: "pp-toolbar-field" }, /* @__PURE__ */ h2("span", null, t("sceneFilter")), /* @__PURE__ */ h2("select", { value: scene, onChange: (event) => setScene(event.target.value), className: "pp-select pp-select-sm" }, /* @__PURE__ */ h2("option", { value: "all" }, t("filterAll")), Object.keys(SCENE_KEYS).map((key) => /* @__PURE__ */ h2("option", { key, value: key }, t(SCENE_KEYS[key]))))), /* @__PURE__ */ h2("label", { className: "pp-toolbar-field" }, /* @__PURE__ */ h2("span", null, t("sortLabel")), /* @__PURE__ */ h2("select", { value: sort, onChange: (event) => setSort(event.target.value), className: "pp-select pp-select-sm" }, /* @__PURE__ */ h2("option", { value: "score" }, t("sortScore")), /* @__PURE__ */ h2("option", { value: "score_asc" }, t("sortScoreAsc")), /* @__PURE__ */ h2("option", { value: "group" }, t("sortGroup")), /* @__PURE__ */ h2("option", { value: "taken_at" }, t("sortTaken")), /* @__PURE__ */ h2("option", { value: "rel_path" }, t("sortPath")))), /* @__PURE__ */ h2("span", { className: "pp-muted" }, total, " ", t("photos")), /* @__PURE__ */ h2(Button, { disabled: undo.length === 0, onClick: undoLast }, t("undoAction")))), error !== null && /* @__PURE__ */ h2("div", { className: "pp-error" }, error, " ", /* @__PURE__ */ h2(Button, { size: "sm", onClick: () => loadPage(0, false) }, t("retry"))), loading && items.length === 0 ? /* @__PURE__ */ h2(StateCard, { kind: "loading", title: t("loading") }) : items.length === 0 ? /* @__PURE__ */ h2(
    StateCard,
    {
      kind: "empty",
      title: t("reviewEmpty"),
      action: filter !== "all" || scene !== "all" ? /* @__PURE__ */ h2(Button, { onClick: () => {
        setFilter("all");
        setScene("all");
      } }, t("clearFilters")) : void 0
    }
  ) : /* @__PURE__ */ h2(Fragment2, null, /* @__PURE__ */ h2("div", { className: "pp-wall", ref: wallRef, style: { height: totalRows * rowHeight } }, Array.from({ length: Math.max(0, visibleRange.end - visibleRange.start) }, (_, offset) => {
    const row = visibleRange.start + offset;
    const rowItems = items.slice(row * columns, (row + 1) * columns);
    if (rowItems.length === 0) return null;
    return /* @__PURE__ */ h2(
      "div",
      {
        className: "pp-wall-row",
        key: `row-${row}`,
        style: {
          top: row * rowHeight,
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
        }
      },
      rowItems.map((item) => {
        const sceneText = Array.isArray(item.scenes) ? item.scenes.map((value) => sceneLabel(t, value)).join(" \xB7 ") : "";
        return /* @__PURE__ */ h2("div", { className: "pp-tile-wrap", key: item.id }, /* @__PURE__ */ h2(
          "button",
          {
            type: "button",
            className: `pp-tile${selected.includes(item.id) ? " selected" : ""}`,
            title: sceneText === "" ? item.relPath : `${item.relPath} \xB7 ${sceneText}`,
            "aria-label": sceneText === "" ? item.relPath : `${item.relPath} \xB7 ${sceneText}`,
            onClick: () => setSingle(item.id)
          },
          /* @__PURE__ */ h2("img", { src: `${item.thumbUrl}?v=${version}`, alt: item.relPath, loading: "lazy" }),
          /* @__PURE__ */ h2(
            "span",
            {
              className: "pp-tile-bar",
              style: { background: VERDICT_COLORS[item.verdict] ?? "var(--dsw-alias-border-l2)" }
            }
          ),
          item.score !== null && /* @__PURE__ */ h2("span", { className: "pp-tile-score" }, Number(item.score).toFixed(1)),
          sceneText !== "" && /* @__PURE__ */ h2("span", { className: "pp-tile-scenes" }, sceneText),
          item.humanVerdict !== null && /* @__PURE__ */ h2("span", { className: "pp-tile-human" }, verdictLabel(t, item.humanVerdict))
        ), /* @__PURE__ */ h2(
          "input",
          {
            className: "pp-check",
            type: "checkbox",
            checked: selected.includes(item.id),
            onChange: () => toggle(item.id),
            "aria-label": item.relPath
          }
        ));
      })
    );
  })), hasMore && wallWidth > 0 && /* @__PURE__ */ h2("div", { className: "pp-load-more", ref: sentinelRef }, loadingMore ? t("loading") : t("loadMore"))), selected.length > 0 && /* @__PURE__ */ h2("div", { className: "pp-batch" }, /* @__PURE__ */ h2("span", { className: "pp-muted" }, t("selectedCount"), " ", selected.length), /* @__PURE__ */ h2(Button, { onClick: () => decide(selected, "keep") }, t("keep")), /* @__PURE__ */ h2(Button, { onClick: () => decide(selected, "maybe") }, t("maybe")), /* @__PURE__ */ h2(Button, { variant: "danger", onClick: () => decide(selected, "reject") }, t("reject")), /* @__PURE__ */ h2(Button, { variant: "ghost", onClick: () => setSelected([]) }, t("clearSelection"))));
}
function storedGuide(key) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
function storeGuide(key, value) {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
  }
}
function SceneEditor({ t, projectId, photoId, detail, onClose, onSaved }) {
  const [selected, setSelected] = (0, import_react2.useState)(Array.isArray(detail.scenes) ? detail.scenes : []);
  const [primary, setPrimary] = (0, import_react2.useState)(detail.primaryScene ?? null);
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)(null);
  const toggle = (scene) => {
    setSelected((current) => {
      if (current.includes(scene)) {
        const next = current.filter((value) => value !== scene);
        if (primary === scene) setPrimary(next[0] ?? null);
        return next;
      }
      if (current.length >= 3) return current;
      return [...current, scene];
    });
  };
  const save = async (clear = false) => {
    setBusy(true);
    setError(null);
    try {
      const nextScenes = clear ? [] : selected;
      await api(`/photo-picker/api/projects/${projectId}/photos/${photoId}/scenes`, {
        method: "PATCH",
        body: JSON.stringify({
          scenes: nextScenes,
          primaryScene: clear || nextScenes.length === 0 ? null : nextScenes.includes(primary ?? "") ? primary : nextScenes[0]
        })
      });
      await onSaved();
      onClose();
    } catch (cause) {
      setError(String(cause));
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ h2(ModalShell, { title: t("editScenes"), closeLabel: t("close"), onClose }, /* @__PURE__ */ h2("div", { className: "pp-form" }, /* @__PURE__ */ h2("div", { className: "pp-muted" }, t("sceneEditHint")), /* @__PURE__ */ h2("div", { className: "pp-scene-options" }, Object.entries(SCENE_KEYS).map(([scene, key]) => /* @__PURE__ */ h2("label", { key: scene }, /* @__PURE__ */ h2(
    "input",
    {
      type: "checkbox",
      checked: selected.includes(scene),
      disabled: busy || !selected.includes(scene) && selected.length >= 3,
      onChange: () => toggle(scene)
    }
  ), t(key)))), /* @__PURE__ */ h2(Field, { label: t("primaryScene") }, /* @__PURE__ */ h2(Select, { value: primary ?? "", disabled: busy || selected.length === 0, onChange: (event) => setPrimary(event.target.value) }, selected.map((scene) => /* @__PURE__ */ h2("option", { key: scene, value: scene }, sceneLabel(t, scene))))), /* @__PURE__ */ h2("div", { className: "pp-muted" }, detail.sceneSource === "human" ? t("sceneSourceHuman") : t("sceneSourceAi")), error !== null && /* @__PURE__ */ h2(StateCard, { kind: "error", title: t("errorTitle"), message: error }), /* @__PURE__ */ h2(ActionBar, { end: true }, detail.sceneSource === "human" && /* @__PURE__ */ h2(Button, { variant: "ghost", disabled: busy, onClick: () => save(true) }, t("resetScenes")), /* @__PURE__ */ h2(Button, { disabled: busy, onClick: onClose }, t("cancel")), /* @__PURE__ */ h2(Button, { variant: "primary", disabled: busy, onClick: () => save(false) }, t("saveScenes")))));
}
function PhotoSingle({ t, projectId, items, photoId, version, onNavigate, onNeedMore, onOpenGroup, onDecide, onClose, onScenesUpdated }) {
  const [detail, setDetail] = (0, import_react2.useState)(null);
  const [error, setError] = (0, import_react2.useState)(null);
  const [showEdited, setShowEdited] = (0, import_react2.useState)(false);
  const [editedFailed, setEditedFailed] = (0, import_react2.useState)(false);
  const [showGrid, setShowGrid] = (0, import_react2.useState)(() => storedGuide("photoPicker.gridGuide"));
  const [showCross, setShowCross] = (0, import_react2.useState)(() => storedGuide("photoPicker.crossGuide"));
  const [deciding, setDeciding] = (0, import_react2.useState)(false);
  const [sceneEditorOpen, setSceneEditorOpen] = (0, import_react2.useState)(false);
  const needMoreRef = (0, import_react2.useRef)(onNeedMore);
  (0, import_react2.useEffect)(() => {
    needMoreRef.current = onNeedMore;
  }, [onNeedMore]);
  const loadDetail = async () => {
    const next = await api(`/photo-picker/api/projects/${projectId}/photos/${photoId}`);
    setDetail(next);
    setError(null);
  };
  (0, import_react2.useEffect)(() => {
    setDetail(null);
    setShowEdited(false);
    setEditedFailed(false);
    loadDetail().catch((cause) => setError(String(cause)));
  }, [photoId]);
  const decide = async (verdict) => {
    if (deciding) return;
    setDeciding(true);
    try {
      await onDecide([photoId], verdict);
      await loadDetail();
    } catch (cause) {
      setError(String(cause));
    } finally {
      setDeciding(false);
    }
  };
  const index = items.findIndex((item) => item.id === photoId);
  const move = async (delta) => {
    let list = items;
    let next = list[index + delta];
    if (next === void 0 && delta > 0 && typeof needMoreRef.current === "function") {
      list = await needMoreRef.current();
      next = list[index + delta];
    }
    if (next !== void 0) onNavigate(next.id);
  };
  (0, import_react2.useEffect)(() => {
    const onKey = (event) => {
      const target = event.target;
      if (target !== null && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "j" || event.key === "ArrowRight") void move(1);
      else if (event.key === "k" || event.key === "ArrowLeft") void move(-1);
      else if (event.key === "p") void decide("keep");
      else if (event.key === "m") void decide("maybe");
      else if (event.key === "x") void decide("reject");
      else if (event.key === "g" && detail?.group !== void 0) onOpenGroup(detail.group.id);
      else if (event.key === " " || event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photoId, index, items, detail, deciding]);
  if (error !== null) return /* @__PURE__ */ h2(StateCard, { kind: "error", title: t("errorTitle"), message: error });
  if (detail === null) return /* @__PURE__ */ h2(StateCard, { kind: "loading", title: t("loading") });
  const dimensions = detail.dimensions ?? {};
  const recipe = detail.editRecipe ?? null;
  const editedUrl = `/photo-picker/media/edit/${projectId}/${photoId}?v=${version}&e=${detail.editSignature ?? "none"}`;
  const canCompare = recipe !== null && !editedFailed;
  const showingEdited = showEdited && canCompare;
  const sceneText = Array.isArray(detail.scenes) ? detail.scenes.map((scene) => sceneLabel(t, scene)).join(" \xB7 ") : "";
  return /* @__PURE__ */ h2("section", { className: "pp-single" }, /* @__PURE__ */ h2("div", { className: "pp-single-head" }, /* @__PURE__ */ h2(BackButton, { label: t("backToWall"), onClick: onClose }), detail.group !== void 0 && /* @__PURE__ */ h2(Button, { onClick: () => onOpenGroup(detail.group.id) }, t("groupCompare")), /* @__PURE__ */ h2("span", { className: "pp-chip" }, index + 1, " / ", items.length), /* @__PURE__ */ h2("span", { className: "pp-pill", "data-tone": detail.verdict }, verdictLabel(t, detail.verdict)), detail.score !== null && /* @__PURE__ */ h2("span", { className: "pp-chip" }, t("scoreLabel"), " ", detail.score), /* @__PURE__ */ h2("span", { className: "pp-muted", style: { marginLeft: "auto" } }, detail.relPath)), /* @__PURE__ */ h2("div", { className: "pp-single-body" }, /* @__PURE__ */ h2("div", { className: "pp-stage" }, /* @__PURE__ */ h2("div", { className: "pp-stage-frame" }, /* @__PURE__ */ h2(
    "img",
    {
      src: showingEdited ? editedUrl : `${detail.previewUrl}?v=${version}`,
      alt: detail.relPath,
      onError: () => {
        if (showingEdited) setEditedFailed(true);
      }
    }
  ), sceneText !== "" && /* @__PURE__ */ h2("span", { className: "pp-stage-scenes", title: sceneText }, sceneText), showGrid && /* @__PURE__ */ h2("div", { className: "pp-guide pp-guide-grid", "aria-hidden": "true" }, /* @__PURE__ */ h2("span", { className: "v", style: { left: "33.333%" } }), /* @__PURE__ */ h2("span", { className: "v", style: { left: "66.666%" } }), /* @__PURE__ */ h2("span", { className: "h", style: { top: "33.333%" } }), /* @__PURE__ */ h2("span", { className: "h", style: { top: "66.666%" } })), showCross && /* @__PURE__ */ h2("div", { className: "pp-guide pp-guide-cross", "aria-hidden": "true" }, /* @__PURE__ */ h2("span", { className: "v", style: { left: "50%" } }), /* @__PURE__ */ h2("span", { className: "h", style: { top: "50%" } })), /* @__PURE__ */ h2("div", { className: "pp-stage-tools" }, /* @__PURE__ */ h2(
    "button",
    {
      type: "button",
      className: "pp-tool-btn",
      "aria-pressed": showGrid,
      onClick: () => {
        const next = !showGrid;
        setShowGrid(next);
        storeGuide("photoPicker.gridGuide", next);
      }
    },
    t("gridGuide")
  ), /* @__PURE__ */ h2(
    "button",
    {
      type: "button",
      className: "pp-tool-btn",
      "aria-pressed": showCross,
      onClick: () => {
        const next = !showCross;
        setShowCross(next);
        storeGuide("photoPicker.crossGuide", next);
      }
    },
    t("crossGuide")
  )), canCompare && /* @__PURE__ */ h2(
    "button",
    {
      type: "button",
      className: "pp-photo-badge",
      "aria-pressed": showingEdited,
      title: t("editToggleHint"),
      onClick: () => setShowEdited((value) => !value)
    },
    showingEdited ? t("editAfter") : t("editBefore")
  ))), /* @__PURE__ */ h2("aside", { className: "pp-card pp-panel" }, /* @__PURE__ */ h2("div", { className: "pp-row", style: { gap: 6 } }, /* @__PURE__ */ h2(Button, { style: { flex: 1 }, disabled: deciding, onClick: () => decide("keep") }, t("keep")), /* @__PURE__ */ h2(Button, { style: { flex: 1 }, disabled: deciding, onClick: () => decide("maybe") }, t("maybe")), /* @__PURE__ */ h2(Button, { variant: "danger", style: { flex: 1 }, disabled: deciding, onClick: () => decide("reject") }, t("reject"))), /* @__PURE__ */ h2(Button, { size: "sm", onClick: () => setSceneEditorOpen(true) }, t("editScenes")), /* @__PURE__ */ h2("div", { className: "pp-kbd" }, t("keyboardHint")), /* @__PURE__ */ h2("div", { className: "pp-meters" }, Object.keys(DIMENSION_LABELS).map((key) => {
    const value = dimensions[key];
    return /* @__PURE__ */ h2("div", { key, className: "pp-meter" }, /* @__PURE__ */ h2("span", { className: "pp-muted" }, t(DIMENSION_LABELS[key])), /* @__PURE__ */ h2("div", { className: "pp-meter-track" }, /* @__PURE__ */ h2("div", { className: "pp-meter-fill", style: { width: `${Math.max(0, Math.min(10, value ?? 0)) * 10}%` } })), /* @__PURE__ */ h2("span", null, value === null || value === void 0 ? "\u2014" : value));
  })), detail.reason !== null && /* @__PURE__ */ h2("div", null, /* @__PURE__ */ h2("div", { className: "pp-section-title", style: { marginBottom: 4 } }, t("reason")), /* @__PURE__ */ h2("div", { className: "pp-reason" }, detail.reason)), (detail.postProcessing ?? []).length > 0 && /* @__PURE__ */ h2("div", null, /* @__PURE__ */ h2("div", { className: "pp-section-title", style: { marginBottom: 6 } }, t("postProcessing")), /* @__PURE__ */ h2("div", { className: "pp-chips" }, detail.postProcessing.map((code) => /* @__PURE__ */ h2("span", { key: code, className: "pp-chip" }, code)))), /* @__PURE__ */ h2("div", null, /* @__PURE__ */ h2("div", { className: "pp-section-title", style: { marginBottom: 6 } }, t("editRecipe")), recipe !== null ? /* @__PURE__ */ h2("div", { className: "pp-chips" }, /* @__PURE__ */ h2("span", { className: "pp-chip" }, t("editCrop"), ": ", recipe.crop.width === 1 && recipe.crop.height === 1 ? t("editCropNone") : `${t("editCropKeep")} ${Math.round(recipe.crop.width * 100)}% \xD7 ${Math.round(recipe.crop.height * 100)}% \xB7 ${t("editCropLeft")} ${Math.round(recipe.crop.left * 100)}% \xB7 ${t("editCropTop")} ${Math.round(recipe.crop.top * 100)}%`), /* @__PURE__ */ h2("span", { className: "pp-chip" }, t("editRotate"), " ", recipe.rotate, "\xB0"), /* @__PURE__ */ h2("span", { className: "pp-chip" }, t("editExposure"), " ", recipe.exposureEv > 0 ? "+" : "", recipe.exposureEv, " EV"), /* @__PURE__ */ h2("span", { className: "pp-chip" }, t("editContrast"), " ", recipe.contrast), /* @__PURE__ */ h2("span", { className: "pp-chip" }, t("editSaturation"), " ", recipe.saturation), /* @__PURE__ */ h2("span", { className: "pp-chip" }, t("editSharpen"), " ", recipe.sharpen)) : /* @__PURE__ */ h2("div", { className: "pp-muted" }, t("editNoRecipe"))), /* @__PURE__ */ h2("div", { className: "pp-muted" }, detail.width, " \xD7 ", detail.height, detail.group !== void 0 ? ` \xB7 ${t("groupRank").replace("{rank}", String(detail.group.rank)).replace("{size}", String(detail.group.size))}` : ""))), sceneEditorOpen && /* @__PURE__ */ h2(
    SceneEditor,
    {
      t,
      projectId,
      photoId,
      detail,
      onClose: () => setSceneEditorOpen(false),
      onSaved: async () => {
        await loadDetail();
        await onScenesUpdated?.();
      }
    }
  ));
}
function ExportDialog({ t, projectId, onClose }) {
  const [dest, setDest] = (0, import_react2.useState)("");
  const [buckets, setBuckets] = (0, import_react2.useState)(["keep", "maybe"]);
  const [mode, setMode] = (0, import_react2.useState)("hardlink");
  const [applyEdits, setApplyEdits] = (0, import_react2.useState)(false);
  const [preview, setPreview] = (0, import_react2.useState)(null);
  const [result, setResult] = (0, import_react2.useState)(null);
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [choosing, setChoosing] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)(null);
  const toggleBucket = (bucket) => setBuckets((current) => current.includes(bucket) ? current.filter((item) => item !== bucket) : [...current, bucket]);
  const toggleEdits = (checked) => {
    setApplyEdits(checked);
    setPreview(null);
  };
  const choose = async () => {
    if (choosing) return;
    setChoosing(true);
    try {
      const picked = await api("/photo-picker/api/fs/choose", { method: "POST" });
      setDest(picked.path);
    } catch (cause) {
      setError(String(cause));
    } finally {
      setChoosing(false);
    }
  };
  const execute = async (action) => {
    setBusy(true);
    setError(null);
    try {
      const data = await api(`/photo-picker/api/projects/${projectId}/export/${action}`, {
        method: "POST",
        body: JSON.stringify({ dest, buckets, mode: applyEdits ? "copy" : mode, edit: applyEdits ? "recipe" : "none" })
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
  return /* @__PURE__ */ h2(ModalShell, { title: t("exportTitle"), closeLabel: t("close"), onClose }, /* @__PURE__ */ h2("div", { className: "pp-form" }, /* @__PURE__ */ h2("label", { className: "pp-field" }, /* @__PURE__ */ h2("span", null, t("exportDest")), /* @__PURE__ */ h2("div", { className: "pp-row", style: { alignItems: "stretch" } }, /* @__PURE__ */ h2(
    "input",
    {
      value: dest,
      onChange: (event) => setDest(event.target.value),
      placeholder: t("destPlaceholder"),
      className: "pp-input",
      style: { flex: 1 }
    }
  ), /* @__PURE__ */ h2(Button, { disabled: choosing, onClick: choose }, choosing ? t("choosingFolder") : t("exportChoose")))), /* @__PURE__ */ h2("div", { className: "pp-row", style: { alignItems: "center" } }, /* @__PURE__ */ h2("span", { className: "pp-muted" }, t("exportBuckets")), ["keep", "maybe", "reject"].map((bucket) => /* @__PURE__ */ h2("label", { key: bucket, className: "pp-chip", style: { cursor: "pointer", gap: 6 } }, /* @__PURE__ */ h2("input", { type: "checkbox", checked: buckets.includes(bucket), onChange: () => toggleBucket(bucket) }), verdictLabel(t, bucket))), /* @__PURE__ */ h2("span", { className: "pp-muted", style: { marginLeft: 8 } }, t("exportMode")), /* @__PURE__ */ h2(
    "select",
    {
      value: applyEdits ? "copy" : mode,
      disabled: applyEdits,
      onChange: (event) => setMode(event.target.value),
      className: "pp-select pp-select-sm"
    },
    /* @__PURE__ */ h2("option", { value: "hardlink" }, t("exportHardlink")),
    /* @__PURE__ */ h2("option", { value: "copy" }, t("exportCopy"))
  )), /* @__PURE__ */ h2("div", { className: "pp-checks" }, /* @__PURE__ */ h2("label", null, /* @__PURE__ */ h2("input", { type: "checkbox", checked: applyEdits, onChange: (event) => toggleEdits(event.target.checked) }), t("editExport"))), applyEdits && /* @__PURE__ */ h2("div", { className: "pp-callout" }, t("editExportHint"))), /* @__PURE__ */ h2("div", { className: "pp-actions" }, /* @__PURE__ */ h2(Button, { disabled: busy || dest === "", onClick: () => execute("preview") }, t("exportPreview")), /* @__PURE__ */ h2("span", { style: { flex: 1 } }), /* @__PURE__ */ h2(Button, { variant: "primary", disabled: busy || dest === "" || preview === null, onClick: () => execute("run") }, t("exportRun"))), error !== null && /* @__PURE__ */ h2("div", { className: "pp-error" }, error), preview !== null && /* @__PURE__ */ h2("div", { className: "pp-callout" }, /* @__PURE__ */ h2("div", null, Object.entries(preview.counts).map(([bucket, count]) => `${verdictLabel(t, bucket)} ${count}`).join(" \xB7 "), " \xB7 ", (preview.totalBytes / 1024 / 1024).toFixed(1), " MB"), /* @__PURE__ */ h2("div", { style: { marginTop: 4 } }, t("exportSkipped"), " ", preview.skippedExisting, " \xB7 ", t("exportConflict"), " ", preview.conflictCount, " \xB7 ", preview.sameVolume ? t("exportSameVolume") : t("exportCrossVolume")), preview.editedCount > 0 && /* @__PURE__ */ h2("div", { style: { marginTop: 4 } }, t("editExport"), ": ", preview.editedCount)), result !== null && /* @__PURE__ */ h2("div", { className: "pp-callout" }, /* @__PURE__ */ h2("div", null, t("exportResult"), ": ", Object.entries(result.counts).map(([bucket, count]) => `${verdictLabel(t, bucket)} ${count}`).join(" \xB7 ")), /* @__PURE__ */ h2("div", { style: { marginTop: 4, wordBreak: "break-all" } }, t("manifest"), ": ", result.manifestPath), /* @__PURE__ */ h2("div", { className: "pp-actions", style: { marginTop: 8 } }, /* @__PURE__ */ h2(
    Button,
    {
      onClick: () => api("/photo-picker/api/fs/reveal", {
        method: "POST",
        body: JSON.stringify({ path: result.manifestPath ?? dest })
      }).catch((cause) => setError(String(cause)))
    },
    t("revealInFinder")
  )), result.failureCount > 0 && /* @__PURE__ */ h2("div", { className: "pp-error", style: { marginTop: 4 } }, t("exportConflict"), ": ", result.failureCount)));
}
function GroupCompare({ t, projectId, groupId, version, onNavigate, onClose, onDecided }) {
  const [groups, setGroups] = (0, import_react2.useState)([]);
  const [detail, setDetail] = (0, import_react2.useState)(null);
  const [selected, setSelected] = (0, import_react2.useState)(0);
  const [page, setPage] = (0, import_react2.useState)(0);
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)(null);
  (0, import_react2.useEffect)(() => {
    api(`/photo-picker/api/projects/${projectId}/groups?limit=200`).then((data) => setGroups(data.items)).catch(() => {
    });
  }, [projectId]);
  (0, import_react2.useEffect)(() => {
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
  (0, import_react2.useEffect)(() => {
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
  if (error !== null) return /* @__PURE__ */ h2(StateCard, { kind: "error", title: t("errorTitle"), message: error });
  if (detail === null) return /* @__PURE__ */ h2(StateCard, { kind: "loading", title: t("loading") });
  const kindLabel = detail.kind === "burst" ? t("groupKindBurst") : t("groupKindScene");
  const pageCount = Math.max(1, Math.ceil(detail.members.length / 6));
  const pageStart = page * 6;
  const visible = detail.members.slice(pageStart, pageStart + 6);
  return /* @__PURE__ */ h2("section", { className: "pp-single" }, /* @__PURE__ */ h2("div", { className: "pp-single-head" }, /* @__PURE__ */ h2(BackButton, { label: t("backToWall"), onClick: onClose }), /* @__PURE__ */ h2("span", { className: "pp-chip" }, kindLabel), /* @__PURE__ */ h2("span", { className: "pp-chip" }, detail.size, " ", t("photos")), pageCount > 1 && /* @__PURE__ */ h2("span", { className: "pp-chip" }, page + 1, " / ", pageCount), /* @__PURE__ */ h2("span", { className: "pp-muted" }, index >= 0 ? `${index + 1} / ${groups.length}` : ""), /* @__PURE__ */ h2("div", { style: { marginLeft: "auto", display: "flex", gap: 6 } }, pageCount > 1 && /* @__PURE__ */ h2(Fragment2, null, /* @__PURE__ */ h2(Button, { size: "sm", "aria-label": t("previousPage"), title: t("previousPage"), disabled: page === 0, onClick: () => {
    setPage(page - 1);
    setSelected(pageStart - 6);
  } }, "\u2039"), /* @__PURE__ */ h2(Button, { size: "sm", "aria-label": t("nextPage"), title: t("nextPage"), disabled: page >= pageCount - 1, onClick: () => {
    setPage(page + 1);
    setSelected(pageStart + 6);
  } }, "\u203A")), /* @__PURE__ */ h2(Button, { size: "sm", "aria-label": t("previousGroup"), title: t("previousGroup"), disabled: index <= 0, onClick: () => switchGroup(-1) }, "\u2190"), /* @__PURE__ */ h2(Button, { size: "sm", "aria-label": t("nextGroup"), title: t("nextGroup"), disabled: index < 0 || index >= groups.length - 1, onClick: () => switchGroup(1) }, "\u2192"))), /* @__PURE__ */ h2("div", { className: "pp-compare-grid" }, visible.map((member, localPosition) => {
    const position = pageStart + localPosition;
    return /* @__PURE__ */ h2(
      "button",
      {
        key: member.id,
        type: "button",
        className: `pp-compare-card${position === selected ? " selected" : ""}`,
        onClick: () => setSelected(position)
      },
      /* @__PURE__ */ h2("img", { src: `${member.thumbUrl}?v=${version}`, alt: member.relPath, loading: "lazy" }),
      /* @__PURE__ */ h2("span", { className: "pp-edit-badge" }, "#", position + 1, member.score !== null && member.score !== void 0 ? ` \xB7 ${Number(member.score).toFixed(1)}` : ""),
      member.humanVerdict !== null && /* @__PURE__ */ h2("span", { className: "pp-pill", style: { position: "absolute", right: 8, bottom: 8, background: "rgba(0,0,0,.62)", color: "#fff" } }, verdictLabel(t, member.humanVerdict))
    );
  })), /* @__PURE__ */ h2("div", { className: "pp-actions" }, /* @__PURE__ */ h2(Button, { variant: "danger", disabled: busy, onClick: () => decide("reject", detail.members.map((member) => member.id)) }, t("groupRejectAll")), /* @__PURE__ */ h2("span", { style: { flex: 1 } }), /* @__PURE__ */ h2(Button, { variant: "primary", disabled: busy, onClick: confirm }, t("groupConfirm"))), /* @__PURE__ */ h2("div", { className: "pp-kbd" }, t("groupHint")));
}
function CalibrationSection({ t, projectId, onApplied }) {
  const [phase, setPhase] = (0, import_react2.useState)("idle");
  const [items, setItems] = (0, import_react2.useState)([]);
  const [index, setIndex] = (0, import_react2.useState)(0);
  const [labels, setLabels] = (0, import_react2.useState)([]);
  const [report, setReport] = (0, import_react2.useState)(null);
  const [latest, setLatest] = (0, import_react2.useState)(null);
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [applied, setApplied] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)(null);
  (0, import_react2.useEffect)(() => {
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
  const summary = (data) => /* @__PURE__ */ h2("div", { className: "pp-calibration-summary" }, /* @__PURE__ */ h2("div", { className: "pp-stats" }, [
    [t("calibrationPrecision"), (data.keep?.precision ?? 0).toFixed(2)],
    [t("calibrationRecall"), (data.keep?.recall ?? 0).toFixed(2)],
    [t("calibrationF1"), (data.keep?.f1 ?? 0).toFixed(2)],
    [t("calibrationAgreement"), `${((data.agreement ?? 0) * 100).toFixed(0)}%`]
  ].map(([label2, value]) => /* @__PURE__ */ h2("div", { className: "pp-stat", key: String(label2) }, /* @__PURE__ */ h2("span", { className: "pp-stat-value" }, value), /* @__PURE__ */ h2("span", { className: "pp-stat-label" }, label2)))), /* @__PURE__ */ h2("div", { className: "pp-row", style: { alignItems: "center" } }, /* @__PURE__ */ h2("span", { className: "pp-chip" }, t("calibrationSuggested"), ": ", verdictLabel(t, "keep"), " \u2265 ", data.suggestedKeep, " \xB7 ", verdictLabel(t, "maybe"), " \u2265 ", data.suggestedMaybe), /* @__PURE__ */ h2(Button, { disabled: busy, onClick: apply2 }, applied ? t("calibrationApplied") : t("calibrationApply"))));
  return /* @__PURE__ */ h2(Card, { className: "pp-panel" }, /* @__PURE__ */ h2("div", { className: "pp-row", style: { alignItems: "center" } }, /* @__PURE__ */ h2("div", { className: "pp-section-title" }, t("calibration")), /* @__PURE__ */ h2(Button, { disabled: busy, onClick: start }, t("calibrationStart")), phase === "idle" && latest?.metrics !== null && latest?.metrics !== void 0 && /* @__PURE__ */ h2("span", { className: "pp-muted", style: { marginLeft: "auto" } }, t("calibrationLast"), ": ", latest.sampleSize, " ", t("photos"))), error !== null && /* @__PURE__ */ h2(StateCard, { kind: "error", title: t("errorTitle"), message: error }), phase === "idle" && latest?.metrics !== null && latest?.metrics !== void 0 && summary(latest.metrics), phase === "blind" && items[index] !== void 0 && /* @__PURE__ */ h2("div", { style: { display: "grid", gap: 12 } }, /* @__PURE__ */ h2("div", { className: "pp-row", style: { alignItems: "center" } }, /* @__PURE__ */ h2("span", { className: "pp-chip" }, t("calibrationProgress").replace("{n}", String(index + 1)).replace("{total}", String(items.length))), /* @__PURE__ */ h2("span", { className: "pp-muted", style: { marginLeft: "auto" } }, t("calibrationHint")), /* @__PURE__ */ h2(CloseButton, { label: t("close"), onClick: () => setPhase("idle") })), /* @__PURE__ */ h2("div", { className: "pp-stage", style: { minHeight: 0, padding: 10 } }, /* @__PURE__ */ h2("img", { src: items[index].previewUrl, alt: items[index].relPath })), /* @__PURE__ */ h2("div", { className: "pp-actions" }, /* @__PURE__ */ h2(Button, { disabled: busy, onClick: () => label("keep") }, t("keep")), /* @__PURE__ */ h2(Button, { disabled: busy, onClick: () => label("maybe") }, t("maybe")), /* @__PURE__ */ h2(Button, { variant: "danger", disabled: busy, onClick: () => label("reject") }, t("reject")))), phase === "report" && report !== null && summary(report));
}
function SettingsDrawer({ t, detail, onClose, onSaved, onRunStage }) {
  const [form, setForm] = (0, import_react2.useState)(() => ({
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
  const [prompt, setPrompt] = (0, import_react2.useState)(null);
  const [models, setModels] = (0, import_react2.useState)([]);
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [saved, setSaved] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)(null);
  (0, import_react2.useEffect)(() => {
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
  return /* @__PURE__ */ h2(DrawerShell, { title: t("settingsTitle"), closeLabel: t("close"), onClose }, /* @__PURE__ */ h2("div", { className: "pp-form" }, /* @__PURE__ */ h2("div", { className: "pp-section-title" }, t("settingsBasic")), /* @__PURE__ */ h2("label", { className: "pp-field" }, /* @__PURE__ */ h2("span", null, t("model")), /* @__PURE__ */ h2("select", { value: form.modelId, onChange: (event) => set("modelId", event.target.value), className: "pp-select" }, (models.length === 0 ? [{ id: form.modelId, name: form.modelId }] : models).map((model) => {
    const supportsImage = Array.isArray(model.inputModalities) ? model.inputModalities.includes("image") : true;
    return /* @__PURE__ */ h2("option", { key: model.id, value: model.id, disabled: !supportsImage }, model.name ?? model.id, supportsImage ? "" : ` \u2014 ${t("settingsNoImageModel")}`);
  }))), /* @__PURE__ */ h2("div", { className: "pp-row" }, /* @__PURE__ */ h2("label", { className: "pp-field" }, /* @__PURE__ */ h2("span", null, t("concurrency")), /* @__PURE__ */ h2("input", { value: form.concurrency, onChange: (event) => set("concurrency", event.target.value), className: "pp-input" })), /* @__PURE__ */ h2("label", { className: "pp-field" }, /* @__PURE__ */ h2("span", null, t("budget")), /* @__PURE__ */ h2("input", { value: form.budgetCny, onChange: (event) => set("budgetCny", event.target.value), className: "pp-input" }))), /* @__PURE__ */ h2("div", { className: "pp-section-title" }, t("gridSize"), " / ", t("thresholds")), /* @__PURE__ */ h2("div", { className: "pp-row" }, /* @__PURE__ */ h2("label", { className: "pp-field" }, /* @__PURE__ */ h2("span", null, t("gridCols")), /* @__PURE__ */ h2("input", { value: form.gridCols, onChange: (event) => set("gridCols", event.target.value), className: "pp-input" })), /* @__PURE__ */ h2("label", { className: "pp-field" }, /* @__PURE__ */ h2("span", null, t("gridRows")), /* @__PURE__ */ h2("input", { value: form.gridRows, onChange: (event) => set("gridRows", event.target.value), className: "pp-input" }))), /* @__PURE__ */ h2("div", { className: "pp-row" }, /* @__PURE__ */ h2("label", { className: "pp-field" }, /* @__PURE__ */ h2("span", null, t("thresholdKeep")), /* @__PURE__ */ h2("input", { value: form.thresholdKeep, onChange: (event) => set("thresholdKeep", event.target.value), className: "pp-input" })), /* @__PURE__ */ h2("label", { className: "pp-field" }, /* @__PURE__ */ h2("span", null, t("thresholdMaybe")), /* @__PURE__ */ h2("input", { value: form.thresholdMaybe, onChange: (event) => set("thresholdMaybe", event.target.value), className: "pp-input" }))), /* @__PURE__ */ h2("div", { className: "pp-section-title" }, t("grouping")), /* @__PURE__ */ h2("div", { className: "pp-row" }, /* @__PURE__ */ h2("label", { className: "pp-field" }, /* @__PURE__ */ h2("span", null, t("burstSeconds")), /* @__PURE__ */ h2("input", { value: form.groupBurstSeconds, onChange: (event) => set("groupBurstSeconds", event.target.value), className: "pp-input" })), /* @__PURE__ */ h2("label", { className: "pp-field" }, /* @__PURE__ */ h2("span", null, t("burstHamming")), /* @__PURE__ */ h2("input", { value: form.groupBurstHamming, onChange: (event) => set("groupBurstHamming", event.target.value), className: "pp-input" }))), /* @__PURE__ */ h2("div", { className: "pp-row" }, /* @__PURE__ */ h2("label", { className: "pp-field" }, /* @__PURE__ */ h2("span", null, t("sceneSeconds")), /* @__PURE__ */ h2("input", { value: form.groupSceneSeconds, onChange: (event) => set("groupSceneSeconds", event.target.value), className: "pp-input" })), /* @__PURE__ */ h2("label", { className: "pp-field" }, /* @__PURE__ */ h2("span", null, t("sceneHamming")), /* @__PURE__ */ h2("input", { value: form.groupSceneHamming, onChange: (event) => set("groupSceneHamming", event.target.value), className: "pp-input" }))), /* @__PURE__ */ h2("div", { className: "pp-section-title" }, t("runOptions")), /* @__PURE__ */ h2("div", { className: "pp-checks" }, /* @__PURE__ */ h2("label", null, /* @__PURE__ */ h2("input", { type: "checkbox", checked: form.stagePause, onChange: (event) => set("stagePause", event.target.checked) }), t("stagePause")), /* @__PURE__ */ h2("label", null, /* @__PURE__ */ h2("input", { type: "checkbox", checked: form.offpeakOnly, onChange: (event) => set("offpeakOnly", event.target.checked) }), t("offpeak"))), prompt !== null && /* @__PURE__ */ h2("details", null, /* @__PURE__ */ h2("summary", { className: "pp-muted", style: { cursor: "pointer" } }, t("promptSection"), " \xB7 ", prompt.version, " \xB7 ", t("viewPrompt")), /* @__PURE__ */ h2("pre", null, prompt.prompts.gridUser, "\n\n---\n\n", prompt.prompts.rankUser, "\n\n---\n\n", prompt.prompts.scoreUser)), /* @__PURE__ */ h2("div", { className: "pp-section-title" }, t("rerunStages")), /* @__PURE__ */ h2("div", { className: "pp-actions" }, ["preprocess", "grid", "rank", "score"].map((stage) => /* @__PURE__ */ h2(Button, { key: stage, onClick: () => onRunStage?.(stage) }, t("rerun"), " ", stageLabel(t, stage)))), /* @__PURE__ */ h2("div", { className: "pp-callout" }, t("sceneRescoreHint")), /* @__PURE__ */ h2("div", { className: "pp-callout" }, t("settingsHint")), error !== null && /* @__PURE__ */ h2(StateCard, { kind: "error", title: t("errorTitle"), message: error }), /* @__PURE__ */ h2("div", { className: "pp-modal-foot" }, /* @__PURE__ */ h2(Button, { variant: "primary", disabled: busy, onClick: save }, t("save")), saved && /* @__PURE__ */ h2("span", { className: "pp-muted" }, t("saved")))));
}
function ProjectDetail({ t, id, onBack }) {
  const [detail, setDetail] = (0, import_react2.useState)(null);
  const [stats, setStats] = (0, import_react2.useState)(null);
  const [progress, setProgress] = (0, import_react2.useState)(null);
  const [checkpoints, setCheckpoints] = (0, import_react2.useState)([]);
  const [pipelineEvent, setPipelineEvent] = (0, import_react2.useState)(null);
  const [singleStepsOpen, setSingleStepsOpen] = (0, import_react2.useState)(false);
  const [noticeDismissed, setNoticeDismissed] = (0, import_react2.useState)(false);
  const [exporting, setExporting] = (0, import_react2.useState)(false);
  const [settingsOpen, setSettingsOpen] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)(null);
  const refresh = async () => {
    try {
      const [project, points, statistics] = await Promise.all([
        api(`/photo-picker/api/projects/${id}`),
        api(`/photo-picker/api/projects/${id}/checkpoints`),
        api(`/photo-picker/api/projects/${id}/stats`)
      ]);
      setDetail(project);
      setCheckpoints(points);
      setStats(statistics);
      setError(null);
    } catch (cause) {
      setError(String(cause));
    }
  };
  (0, import_react2.useEffect)(() => {
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
  (0, import_react2.useEffect)(() => {
    if (pipelineEvent !== null && pipelineEvent.stage === "pipeline" && (pipelineEvent.result !== void 0 || pipelineEvent.error !== void 0)) {
      setNoticeDismissed(false);
    }
  }, [pipelineEvent]);
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
  if (detail === null) {
    return /* @__PURE__ */ h2(StateCard, { kind: "loading", title: t("loading") });
  }
  const counts = detail.counts ?? {};
  const verdicts = stats?.verdicts ?? {};
  const version = detail.updatedAt ?? 0;
  const aiDisabled = detail.ai?.hasImageModel === false;
  const percent = progress?.total ? Math.min(100, Math.round((progress.done ?? 0) / progress.total * 100)) : 0;
  const stages = ["scan", "preprocess", "grid", "rank", "score"];
  const stageStatus = {};
  for (const checkpoint of checkpoints) stageStatus[checkpoint.stage] = checkpoint.status;
  const activeStage = detail.running === "pipeline" ? progress?.stage : detail.running;
  const runningLabel = detail.running === null ? null : detail.running === "pipeline" ? t("autoRun") : stageLabel(t, detail.running);
  const spent = Number(detail.cost?.spentCny ?? 0);
  const budget = Number(detail.cost?.budgetCny ?? 0);
  const statItems = [
    { key: "scored", label: t("stateScored"), value: String(counts.scored ?? 0) },
    { key: "keep", label: verdictLabel(t, "keep"), value: String(verdicts.keep ?? 0) },
    { key: "maybe", label: verdictLabel(t, "maybe"), value: String(verdicts.maybe ?? 0) },
    { key: "reject", label: verdictLabel(t, "reject"), value: String(verdicts.reject ?? 0) },
    { key: "spent", label: t("spent"), value: `\xA5${spent.toFixed(2)}`, hint: `/ \xA5${budget}` }
  ];
  let pipelineNotice = null;
  if (pipelineEvent !== null && pipelineEvent.stage === "pipeline") {
    if (pipelineEvent.error !== void 0) {
      pipelineNotice = {
        kind: "failed",
        text: t("autoFailedToast").replace("{error}", String(pipelineEvent.error))
      };
    } else if (pipelineEvent.result !== void 0) {
      const completed = (pipelineEvent.result.completed ?? []).map((stage) => stageLabel(t, stage)).join(" \u2192 ");
      if (pipelineEvent.result.reason === "paused") {
        pipelineNotice = {
          kind: "paused",
          text: t("autoPausedToast").replace("{stages}", completed || "\u2014").replace("{next}", pipelineEvent.result.stoppedAt !== null && pipelineEvent.result.stoppedAt !== void 0 ? stageLabel(t, pipelineEvent.result.stoppedAt) : "\u2014")
        };
      } else {
        pipelineNotice = { kind: "done", text: t("autoDoneToast").replace("{stages}", completed) };
      }
    }
  }
  return /* @__PURE__ */ h2("div", { className: "pp-detail" }, /* @__PURE__ */ h2("div", { className: "pp-page-nav" }, /* @__PURE__ */ h2(BackButton, { label: t("back"), onClick: onBack })), /* @__PURE__ */ h2(Card, { className: "pp-summary" }, /* @__PURE__ */ h2("div", { className: "pp-summary-top" }, /* @__PURE__ */ h2("strong", { className: "pp-project-title" }, detail.name), /* @__PURE__ */ h2("span", { className: "pp-pill" }, statusLabel(t, detail.status)), detail.sourceKind !== "local" && /* @__PURE__ */ h2("span", { className: "pp-chip" }, detail.sourceOnline === false ? t("networkOffline") : t("smbConnected")), runningLabel !== null && /* @__PURE__ */ h2("span", { className: "pp-pill", "data-tone": "live" }, t("running"), " \xB7 ", runningLabel), /* @__PURE__ */ h2("span", { className: "pp-path pp-summary-path", title: detail.sourcePath }, detail.sourcePath)), /* @__PURE__ */ h2("div", { className: "pp-stats" }, statItems.map((item) => /* @__PURE__ */ h2("div", { className: "pp-stat", key: item.key }, /* @__PURE__ */ h2("span", { className: "pp-stat-value" }, item.value), /* @__PURE__ */ h2("span", { className: "pp-stat-label" }, item.label, item.hint !== void 0 ? ` ${item.hint}` : "")))), /* @__PURE__ */ h2(ActionBar, null, /* @__PURE__ */ h2(Button, { variant: "primary", disabled: detail.running !== null, onClick: runAll }, t("autoRun")), detail.running !== null && /* @__PURE__ */ h2(Button, { onClick: () => run(detail.running, "pause") }, t("pause")), /* @__PURE__ */ h2("div", { style: { position: "relative" } }, /* @__PURE__ */ h2(Button, { onClick: () => setSingleStepsOpen((open) => !open) }, t("singleStep"), " ", singleStepsOpen ? "\u25B4" : "\u25BE"), singleStepsOpen && /* @__PURE__ */ h2("div", { className: "pp-menu" }, stages.map((stage) => /* @__PURE__ */ h2(
    Button,
    {
      key: stage,
      disabled: aiDisabled && ["grid", "rank", "score"].includes(stage),
      onClick: () => {
        setSingleStepsOpen(false);
        run(stage);
      }
    },
    stage === "scan" ? t("scan") : stage === "preprocess" ? t("preprocess") : stageLabel(t, stage)
  )))), /* @__PURE__ */ h2("span", { style: { flex: 1 } }), /* @__PURE__ */ h2(Button, { onClick: () => setExporting(true) }, t("export")), /* @__PURE__ */ h2(Button, { onClick: () => setSettingsOpen(true) }, t("settings"))), /* @__PURE__ */ h2("div", { className: "pp-steps" }, stages.map((stage) => {
    const status = stage === activeStage ? "running" : stageStatus[stage] ?? "pending";
    return /* @__PURE__ */ h2("span", { className: "pp-step", key: stage, title: runStatusLabel(t, status) }, /* @__PURE__ */ h2("span", { className: "pp-dot", "data-status": status }), /* @__PURE__ */ h2("strong", null, stageLabel(t, stage)), /* @__PURE__ */ h2("span", null, runStatusLabel(t, status)));
  })), detail.running !== null && /* @__PURE__ */ h2("div", { className: "pp-progress" }, /* @__PURE__ */ h2("div", { className: "pp-muted" }, activeStage !== void 0 && activeStage !== null ? stageLabel(t, activeStage) : t("running"), " ", progress?.done ?? 0, "/", progress?.total ?? "?", progress?.costCny !== void 0 ? ` \xB7 \xA5${Number(progress.costCny).toFixed(4)}` : ""), /* @__PURE__ */ h2("div", { className: "pp-progress-track" }, /* @__PURE__ */ h2("div", { className: "pp-progress-fill", style: { width: `${percent}%` } }))), pipelineEvent !== null && /* @__PURE__ */ h2("div", { className: "pp-muted" }, pipelineEvent.error !== void 0 ? `${t("pipelineFailed")}: ${pipelineEvent.error}` : pipelineEvent.stage === "pipeline" && pipelineEvent.result !== void 0 ? `${pipelineEvent.result.reason === "paused" ? t("pipelinePaused") : t("pipelineDone")}: ${(pipelineEvent.result.completed ?? []).map((stage) => stageLabel(t, stage)).join(" \u2192 ")}${pipelineEvent.result.stoppedAt !== null && pipelineEvent.result.stoppedAt !== void 0 ? ` \xB7 ${t("nextStage")} ${stageLabel(t, pipelineEvent.result.stoppedAt)}` : ""}` : `${t("autoRun")}: ${stageLabel(t, pipelineEvent.stage)} \xB7 ${phaseLabel(t, pipelineEvent.phase)}`), aiDisabled && /* @__PURE__ */ h2("div", { className: "pp-callout" }, t("aiDisabled"))), exporting && /* @__PURE__ */ h2(ExportDialog, { t, projectId: id, onClose: () => setExporting(false) }), settingsOpen && /* @__PURE__ */ h2(
    SettingsDrawer,
    {
      t,
      detail: { ...detail, id },
      onClose: () => setSettingsOpen(false),
      onSaved: refresh,
      onRunStage: (stage) => run(stage)
    }
  ), error !== null && /* @__PURE__ */ h2(StateCard, { kind: "error", title: t("errorTitle"), message: error }), checkpoints.length > 0 && /* @__PURE__ */ h2("details", { className: "pp-card pp-history" }, /* @__PURE__ */ h2("summary", null, /* @__PURE__ */ h2("span", null, t("history")), /* @__PURE__ */ h2("span", { className: "pp-muted pp-history-count" }, checkpoints.filter((checkpoint) => checkpoint.status === "done").length, " / ", checkpoints.length)), /* @__PURE__ */ h2("div", { className: "pp-history-body" }, checkpoints.map((checkpoint) => /* @__PURE__ */ h2("div", { key: checkpoint.stage }, /* @__PURE__ */ h2("div", { className: "pp-history-row" }, /* @__PURE__ */ h2("strong", null, stageLabel(t, checkpoint.stage)), /* @__PURE__ */ h2("span", { className: "pp-pill" }, runStatusLabel(t, checkpoint.status)), /* @__PURE__ */ h2("span", { className: "pp-muted" }, summarizeStats(t, checkpoint.stats)), /* @__PURE__ */ h2("span", { className: "pp-chip" }, "\xA5", Number(checkpoint.costCny ?? 0).toFixed(4))), (checkpoint.sampleIds ?? []).length > 0 && /* @__PURE__ */ h2("details", { className: "pp-history-samples" }, /* @__PURE__ */ h2("summary", null, t("samples"), " \xB7 ", checkpoint.sampleIds.length), /* @__PURE__ */ h2("div", null, checkpoint.sampleIds.map((pid) => /* @__PURE__ */ h2(
    "img",
    {
      key: pid,
      src: `/photo-picker/media/thumb/${id}/${pid}?v=${version}`,
      alt: pid,
      loading: "lazy"
    }
  )))))))), /* @__PURE__ */ h2(ReviewSection, { t, projectId: id, version, onChanged: refresh }), /* @__PURE__ */ h2(CalibrationSection, { t, projectId: id, onApplied: refresh }), pipelineNotice !== null && !noticeDismissed && /* @__PURE__ */ h2("div", { className: "pp-toast", "data-kind": pipelineNotice.kind, "aria-live": "polite" }, /* @__PURE__ */ h2("span", { style: { flex: 1 } }, pipelineNotice.text), /* @__PURE__ */ h2(Button, { size: "sm", variant: "ghost", onClick: () => setNoticeDismissed(true) }, t("close"))));
}
function Workbench({ t }) {
  (0, import_react2.useSyncExternalStore)(subscribeLanguage, getLanguage);
  const [projects, setProjects] = (0, import_react2.useState)(null);
  const [selected, setSelected] = (0, import_react2.useState)(null);
  const [creating, setCreating] = (0, import_react2.useState)(false);
  const [deleting, setDeleting] = (0, import_react2.useState)(null);
  const [error, setError] = (0, import_react2.useState)(null);
  const reload = async () => {
    try {
      setProjects(await api("/photo-picker/api/projects"));
      setError(null);
    } catch (cause) {
      setProjects([]);
      setError(String(cause));
    }
  };
  (0, import_react2.useEffect)(() => {
    reload();
  }, []);
  const deleteProject = async (project) => {
    if (!window.confirm(t("deleteProjectConfirm").replace("{name}", project.name))) return;
    setDeleting(project.id);
    setError(null);
    try {
      await api(`/photo-picker/api/projects/${project.id}`, { method: "DELETE" });
      await reload();
    } catch (cause) {
      setError(String(cause));
    } finally {
      setDeleting(null);
    }
  };
  const list = projects ?? [];
  return /* @__PURE__ */ h2("div", { className: "pp-page" }, /* @__PURE__ */ h2("div", { className: "pp-shell" }, /* @__PURE__ */ h2("header", { className: "pp-header" }, /* @__PURE__ */ h2("div", { className: "pp-title-wrap" }, /* @__PURE__ */ h2("span", { className: "pp-mark", "aria-hidden": "true" }, /* @__PURE__ */ h2("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none" }, /* @__PURE__ */ h2("circle", { cx: "12", cy: "12", r: "8.4", stroke: "currentColor", strokeWidth: "1.6" }), /* @__PURE__ */ h2("path", { d: "M12 3.9 16.15 8.3l-1.55 5.25h-5.2L7.85 8.3 12 3.9Z", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" }), /* @__PURE__ */ h2("circle", { cx: "12", cy: "12", r: "2.6", stroke: "currentColor", strokeWidth: "1.4" }))), /* @__PURE__ */ h2("div", null, /* @__PURE__ */ h2("h1", { className: "pp-title" }, t("title")), /* @__PURE__ */ h2("p", { className: "pp-subtitle" }, t("subtitle")))), /* @__PURE__ */ h2("div", { className: "pp-header-actions" }, /* @__PURE__ */ h2(
    "button",
    {
      type: "button",
      className: "pp-lang",
      title: t("language"),
      onClick: () => setLanguage(getLanguage() === "zh" ? "en" : "zh")
    },
    getLanguage() === "zh" ? "EN" : "\u4E2D"
  ), /* @__PURE__ */ h2(Button, { variant: "primary", onClick: () => {
    setCreating(true);
    setSelected(null);
  } }, t("newProject")))), error !== null && /* @__PURE__ */ h2(StateCard, { kind: "error", title: t("errorTitle"), message: error }), selected !== null ? /* @__PURE__ */ h2(ProjectDetail, { t, id: selected, onBack: () => setSelected(null) }) : creating ? /* @__PURE__ */ h2(
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
  ) : projects === null ? /* @__PURE__ */ h2(StateCard, { kind: "loading", title: t("loading") }) : list.length === 0 ? /* @__PURE__ */ h2(
    StateCard,
    {
      kind: "empty",
      title: t("empty"),
      message: t("subtitle"),
      action: /* @__PURE__ */ h2(Button, { variant: "primary", onClick: () => setCreating(true) }, t("newProject"))
    }
  ) : /* @__PURE__ */ h2("div", { className: "pp-projects" }, list.map((project) => /* @__PURE__ */ h2("div", { className: "pp-project-wrap", key: project.id }, /* @__PURE__ */ h2(
    "button",
    {
      type: "button",
      className: "pp-project",
      onClick: () => setSelected(project.id)
    },
    /* @__PURE__ */ h2("span", { className: "pp-project-top" }, /* @__PURE__ */ h2("strong", { className: "pp-project-name" }, project.name), /* @__PURE__ */ h2("span", { className: "pp-pill" }, statusLabel(t, project.status)), /* @__PURE__ */ h2("span", { className: "pp-chevron" }, "\u2192")),
    /* @__PURE__ */ h2("span", { className: "pp-project-path", title: project.sourcePath }, project.sourcePath),
    /* @__PURE__ */ h2("span", { className: "pp-project-meta" }, /* @__PURE__ */ h2("span", { className: "pp-chip" }, Object.values(project.counts ?? {}).reduce((sum, n) => sum + Number(n ?? 0), 0), " ", t("photos")), Object.entries(project.counts ?? {}).map(([state, n]) => /* @__PURE__ */ h2("span", { className: "pp-chip", key: state }, stateLabel(t, state), " ", String(n))), /* @__PURE__ */ h2("span", { className: "pp-project-spent" }, t("spent"), " \xA5", Number(project.cost?.spentCny ?? 0).toFixed(4)))
  ), /* @__PURE__ */ h2(
    Button,
    {
      size: "sm",
      variant: "danger",
      className: "pp-project-delete",
      disabled: deleting === project.id,
      onClick: () => {
        void deleteProject(project);
      }
    },
    t("deleteProject")
  ))))));
}
function PhotoPickerIcon({ size }) {
  const edge = size ?? 16;
  return /* @__PURE__ */ h2("svg", { width: edge, height: edge, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", style: { display: "block" } }, /* @__PURE__ */ h2("circle", { cx: "12", cy: "12", r: "8.4", stroke: "currentColor", strokeWidth: "1.6" }), /* @__PURE__ */ h2("path", { d: "M12 3.9 16.15 8.3l-1.55 5.25h-5.2L7.85 8.3 12 3.9Z", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" }), /* @__PURE__ */ h2("circle", { cx: "12", cy: "12", r: "2.6", stroke: "currentColor", strokeWidth: "1.4" }));
}
var inject = ["slots", "locale"];
function apply(ctx) {
  installStyles();
  const t = (key) => translate(getLanguage(), key);
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "photo-picker.locale");
  ctx.slots.inject("main", () => ctx.slots.register(
    { name: "main", key: PANEL_ID },
    () => /* @__PURE__ */ h2(Workbench, { t })
  ));
  ctx.slots.inject("sidebar.panellist", () => ctx.slots.register(
    { name: "sidebar.panellist", id: PANEL_ID, order: 20, label: () => t("title") },
    PhotoPickerIcon
  ));
}

    return module.exports;
  },
});
