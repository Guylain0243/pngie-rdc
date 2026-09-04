CREATE TABLE nocode_workflow_instance (
  instance_id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES nocode_workflow(workflow_id),
  etape_courante_id TEXT REFERENCES nocode_workflow_etape(etape_id),
  donnees TEXT NOT NULL DEFAULT '{}',
  statut TEXT NOT NULL DEFAULT 'EN_COURS',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_nocode_workflow_instance_workflow ON nocode_workflow_instance(workflow_id);
CREATE INDEX idx_nocode_workflow_instance_etape_courante ON nocode_workflow_instance(etape_courante_id);
