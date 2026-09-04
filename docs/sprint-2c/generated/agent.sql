CREATE TABLE agent (
  agent_id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance TEXT NOT NULL,
  matricule TEXT NOT NULL,
  numero_identite_nationale TEXT,
  sexe TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  institution_id TEXT NOT NULL REFERENCES institution(institution_id),
  grade_id TEXT,
  corps_id TEXT,
  personne_id TEXT REFERENCES personne(personne_id),
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_agent_institution ON agent(institution_id);
CREATE INDEX idx_agent_personne ON agent(personne_id);
