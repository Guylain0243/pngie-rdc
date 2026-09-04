CREATE TABLE meta_notification_rule (
  rule_id TEXT PRIMARY KEY,
  entite TEXT NOT NULL,
  evenement TEXT NOT NULL,
  condition_json TEXT NOT NULL,
  message_template TEXT NOT NULL,
  canal TEXT NOT NULL DEFAULT 'INTERNE',
  destinataire_role_code TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
