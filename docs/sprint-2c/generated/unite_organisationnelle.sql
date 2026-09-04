CREATE TABLE unite_organisationnelle (
  unite_id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institution(institution_id),
  unite_parent_id TEXT REFERENCES unite_organisationnelle(unite_id),
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  type_unite TEXT NOT NULL,
  niveau_hierarchique INTEGER NOT NULL DEFAULT 0,
  mission TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  niveau_confiance TEXT NOT NULL DEFAULT 'A_VALIDER',
  pourcentage_confiance INTEGER,
  participe_calculs BOOLEAN
);
CREATE INDEX idx_unite_organisationnelle_institution ON unite_organisationnelle(institution_id);
CREATE INDEX idx_unite_organisationnelle_unite_parent ON unite_organisationnelle(unite_parent_id);
