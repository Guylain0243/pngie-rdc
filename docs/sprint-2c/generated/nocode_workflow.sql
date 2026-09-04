CREATE TABLE nocode_workflow (
  workflow_id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  institution_id TEXT REFERENCES institution(institution_id),
  description TEXT,
  statut TEXT NOT NULL DEFAULT 'BROUILLON',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_nocode_workflow_institution ON nocode_workflow(institution_id);
