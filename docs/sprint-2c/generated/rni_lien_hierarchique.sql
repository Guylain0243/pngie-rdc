CREATE TABLE rni_lien_hierarchique (
  lien_id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institution(institution_id),
  institution_parent_id TEXT NOT NULL REFERENCES institution(institution_id),
  type_lien TEXT NOT NULL,
  reference_juridique TEXT,
  date_debut TEXT NOT NULL DEFAULT (date('now')),
  date_fin TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_rni_lien_hierarchique_institution ON rni_lien_hierarchique(institution_id);
CREATE INDEX idx_rni_lien_hierarchique_institution_parent ON rni_lien_hierarchique(institution_parent_id);
