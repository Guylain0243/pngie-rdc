CREATE TABLE personne_role (
  personne_role_id TEXT PRIMARY KEY,
  personne_id TEXT NOT NULL REFERENCES personne(personne_id),
  role_id TEXT NOT NULL REFERENCES role(role_id),
  scope_institution_id TEXT REFERENCES institution(institution_id),
  date_attribution TEXT NOT NULL DEFAULT (datetime('now')),
  date_expiration TEXT,
  statut TEXT NOT NULL DEFAULT 'ACTIF'
);
CREATE INDEX idx_personne_role_personne ON personne_role(personne_id);
CREATE INDEX idx_personne_role_role ON personne_role(role_id);
CREATE INDEX idx_personne_role_scope_institution ON personne_role(scope_institution_id);
