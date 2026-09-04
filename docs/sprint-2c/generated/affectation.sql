CREATE TABLE affectation (
  affectation_id TEXT PRIMARY KEY,
  personne_id TEXT NOT NULL REFERENCES personne(personne_id),
  poste_id TEXT NOT NULL REFERENCES poste(poste_id),
  type_affectation TEXT NOT NULL DEFAULT 'TITULAIRE',
  date_debut TEXT NOT NULL,
  date_fin TEXT,
  texte_nomination TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_affectation_personne ON affectation(personne_id);
CREATE INDEX idx_affectation_poste ON affectation(poste_id);
