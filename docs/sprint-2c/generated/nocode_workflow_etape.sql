CREATE TABLE nocode_workflow_etape (
  etape_id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES nocode_workflow(workflow_id),
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  ordre INTEGER NOT NULL,
  role_metier_id TEXT REFERENCES role_metier(role_metier_id),
  type_etape TEXT NOT NULL DEFAULT 'VALIDATION',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_nocode_workflow_etape_workflow ON nocode_workflow_etape(workflow_id);
CREATE INDEX idx_nocode_workflow_etape_role_metier ON nocode_workflow_etape(role_metier_id);
