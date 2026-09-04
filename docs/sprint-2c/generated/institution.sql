CREATE TABLE institution (
  institution_id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  sigle TEXT,
  type_institution TEXT NOT NULL,
  institution_parent_id TEXT REFERENCES institution(institution_id),
  niveau_hierarchique INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  adresse TEXT,
  latitude REAL,
  longitude REAL,
  telephone TEXT,
  email TEXT,
  site_web TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  date_creation_legale TEXT,
  texte_creation TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_institution_parent ON institution(institution_parent_id);
