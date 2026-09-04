CREATE TABLE agent_ia (
  agent_id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  type_agent TEXT NOT NULL,
  institution_id TEXT REFERENCES institution(institution_id),
  modele_reference TEXT,
  perimetre_donnees TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_agent_ia_institution ON agent_ia(institution_id);
