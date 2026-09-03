CREATE TABLE poste (
  poste_id TEXT PRIMARY KEY,
  unite_id TEXT NOT NULL REFERENCES unite_organisationnelle(unite_id),
  code TEXT NOT NULL,
  intitule TEXT NOT NULL,
  poste_hierarchique_id TEXT REFERENCES poste(poste_id),
  niveau_hierarchique INTEGER NOT NULL DEFAULT 0,
  categorie TEXT,
  missions TEXT,
  attributions TEXT,
  responsabilites TEXT,
  competences_requises TEXT,
  nombre_postes_autorises INTEGER NOT NULL DEFAULT 1,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  niveau_confiance TEXT NOT NULL DEFAULT 'A_VALIDER',
  pourcentage_confiance INTEGER,
  participe_calculs BOOLEAN
);
CREATE INDEX idx_poste_unite ON poste(unite_id);
CREATE INDEX idx_poste_hierarchique ON poste(poste_hierarchique_id);
