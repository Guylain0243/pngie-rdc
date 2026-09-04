CREATE TABLE meta_rule (
  rule_id TEXT PRIMARY KEY,
  entite TEXT NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  evenement TEXT NOT NULL,
  condition_json TEXT NOT NULL,
  message_erreur TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
