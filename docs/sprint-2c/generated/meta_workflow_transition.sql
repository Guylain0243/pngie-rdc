CREATE TABLE meta_workflow_transition (
  transition_id TEXT PRIMARY KEY,
  entite TEXT NOT NULL,
  from_statut TEXT NOT NULL,
  to_statut TEXT NOT NULL,
  role_code_requis TEXT REFERENCES role(code),
  condition_json TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_meta_workflow_transition_role_code_requis ON meta_workflow_transition(role_code_requis);
