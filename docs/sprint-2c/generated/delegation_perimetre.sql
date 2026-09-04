CREATE TABLE delegation_perimetre (
  delegation_perimetre_id TEXT PRIMARY KEY,
  delegation_id TEXT NOT NULL REFERENCES delegation_pouvoir(delegation_id),
  institution_id TEXT NOT NULL REFERENCES institution(institution_id),
  entity TEXT NOT NULL,
  action TEXT NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_delegation_perimetre_delegation ON delegation_perimetre(delegation_id);
CREATE INDEX idx_delegation_perimetre_institution ON delegation_perimetre(institution_id);
