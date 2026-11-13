import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  workspace_dir TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_path TEXT NOT NULL,
  mount_point TEXT,
  source_readonly INTEGER NOT NULL DEFAULT 1,
  theme TEXT NOT NULL DEFAULT 'mixed',
  model_route TEXT NOT NULL DEFAULT 'deepseek-official',
  model_id TEXT NOT NULL DEFAULT 'deepseek-flash',
  budget_cny REAL NOT NULL DEFAULT 30,
  concurrency INTEGER NOT NULL DEFAULT 8,
  offpeak_only INTEGER NOT NULL DEFAULT 0,
  grid_cols INTEGER NOT NULL DEFAULT 4,
  grid_rows INTEGER NOT NULL DEFAULT 4,
  threshold_keep REAL NOT NULL DEFAULT 7.5,
  threshold_maybe REAL NOT NULL DEFAULT 6.0,
  stage_pause INTEGER NOT NULL DEFAULT 0,
  group_burst_seconds REAL NOT NULL DEFAULT 2,
  group_burst_hamming INTEGER NOT NULL DEFAULT 12,
  group_scene_seconds REAL NOT NULL DEFAULT 60,
  group_scene_hamming INTEGER NOT NULL DEFAULT 6,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  status TEXT NOT NULL DEFAULT 'created',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rel_path TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  mtime_ms INTEGER NOT NULL DEFAULT 0,
  format TEXT NOT NULL DEFAULT 'other',
  width INTEGER,
  height INTEGER,
  orientation INTEGER,
  taken_at INTEGER,
  camera TEXT,
  lens TEXT,
  sha256 TEXT,
  dhash TEXT,
  blur_score REAL,
  clip_low REAL,
  clip_high REAL,
  group_id TEXT,
  thumb_path TEXT,
  preview_path TEXT,
  state TEXT NOT NULL DEFAULT 'ok',
  error TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE (project_id, rel_path)
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  representative_photo_id TEXT,
  size INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER,
  ended_at INTEGER
);

CREATE TABLE IF NOT EXISTS grids (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  cols INTEGER NOT NULL,
  rows INTEGER NOT NULL,
  image_path TEXT,
  cell_map_json TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  selected_cells_json TEXT,
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  cost_cny REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS stage_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  cursor TEXT,
  stats_json TEXT,
  cost_cny REAL NOT NULL DEFAULT 0,
  error TEXT,
  started_at INTEGER,
  finished_at INTEGER
);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  target_kind TEXT NOT NULL,
  target_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  model_route TEXT,
  model_id TEXT,
  prompt_version TEXT,
  score REAL,
  verdict TEXT,
  dimensions_json TEXT,
  post_processing_json TEXT,
  recipe_json TEXT,
  reason TEXT,
  raw_json TEXT,
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  cost_cny REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS decisions (
  photo_id TEXT PRIMARY KEY REFERENCES photos(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  verdict TEXT NOT NULL,
  note TEXT,
  source TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  dest TEXT NOT NULL,
  mode TEXT NOT NULL,
  buckets_json TEXT,
  counts_json TEXT,
  manifest_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS errors (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage TEXT,
  photo_id TEXT,
  code TEXT,
  message TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS mounts (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  mount_point TEXT,
  auto_mounted INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'disconnected',
  last_seen_at INTEGER
);

CREATE TABLE IF NOT EXISTS calibration_reports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sample_size INTEGER NOT NULL,
  metrics_json TEXT,
  suggested_threshold REAL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_project_state ON photos(project_id, state);
CREATE INDEX IF NOT EXISTS idx_photos_project_group ON photos(project_id, group_id);
CREATE INDEX IF NOT EXISTS idx_photos_project_taken ON photos(project_id, taken_at);
CREATE INDEX IF NOT EXISTS idx_stage_runs_project ON stage_runs(project_id, stage);
CREATE INDEX IF NOT EXISTS idx_assess_target ON assessments(target_kind, target_id);
`

/** 旧项目库没有 recipe_json；CREATE TABLE IF NOT EXISTS 不会补列，必须显式迁移。 */
export function ensureAssessmentRecipeColumn(db) {
  const columns = db.prepare('PRAGMA table_info(assessments)').all().map(row => row.name)
  if (!columns.includes('recipe_json')) {
    db.exec('ALTER TABLE assessments ADD COLUMN recipe_json TEXT')
  }
}

/** 打开（必要时创建）一个项目数据库。 */
export function openDb(workspaceDir) {
  mkdirSync(workspaceDir, { recursive: true })
  const db = new DatabaseSync(path.join(workspaceDir, 'db.sqlite'))
  db.exec('PRAGMA journal_mode=WAL;')
  db.exec('PRAGMA foreign_keys=ON;')
  db.exec(SCHEMA)
  ensureAssessmentRecipeColumn(db)
  return db
}

/** 关闭数据库；重复关闭不报错。 */
export function closeDb(db) {
  try {
    db.close()
  } catch {
    // already closed
  }
}
