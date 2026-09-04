CREATE TABLE decision_action (
  action_id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL REFERENCES decision_gouvernementale(decision_id),
  institution_id TEXT NOT NULL REFERENCES institution(institution_id),
  statut TEXT NOT NULL DEFAULT 'NON_DEMARREE',
  taux_execution INTEGER NOT NULL DEFAULT 0,
  commentaire TEXT,
  date_echeance TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_decision_action_decision ON decision_action(decision_id);
CREATE INDEX idx_decision_action_institution ON decision_action(institution_id);
