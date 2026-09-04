CREATE TABLE delegation_pouvoir (
  delegation_id TEXT PRIMARY KEY,
  delegant_id TEXT NOT NULL REFERENCES personne(personne_id),
  delegataire_id TEXT NOT NULL REFERENCES personne(personne_id),
  perimetre TEXT NOT NULL,
  date_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  texte_reference TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_delegation_pouvoir_delegant ON delegation_pouvoir(delegant_id);
CREATE INDEX idx_delegation_pouvoir_delegataire ON delegation_pouvoir(delegataire_id);
