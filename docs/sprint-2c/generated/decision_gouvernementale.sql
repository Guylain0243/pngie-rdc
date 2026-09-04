CREATE TABLE decision_gouvernementale (
  decision_id TEXT PRIMARY KEY,
  emetteur_institution_id TEXT NOT NULL REFERENCES institution(institution_id),
  titre TEXT NOT NULL,
  description TEXT,
  date_emission TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'EN_COURS',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  cree_par TEXT,
  date_publication TEXT,
  publie_par TEXT,
  date_archivage TEXT,
  archive_par TEXT
);
CREATE INDEX idx_decision_gouvernementale_emetteur_institution ON decision_gouvernementale(emetteur_institution_id);
