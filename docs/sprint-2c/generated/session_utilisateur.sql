CREATE TABLE session_utilisateur (
  session_id TEXT PRIMARY KEY,
  personne_id TEXT NOT NULL REFERENCES personne(personne_id),
  token_hash TEXT NOT NULL,
  adresse_ip TEXT,
  user_agent TEXT,
  date_debut TEXT NOT NULL DEFAULT (datetime('now')),
  date_expiration TEXT NOT NULL,
  date_revocation TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF'
);
CREATE INDEX idx_session_utilisateur_personne ON session_utilisateur(personne_id);
