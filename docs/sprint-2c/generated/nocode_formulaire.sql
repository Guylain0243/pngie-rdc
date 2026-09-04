CREATE TABLE nocode_formulaire (
  formulaire_id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  workflow_id TEXT REFERENCES nocode_workflow(workflow_id),
  schema_champs TEXT NOT NULL DEFAULT '[]',
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_nocode_formulaire_workflow ON nocode_formulaire(workflow_id);
