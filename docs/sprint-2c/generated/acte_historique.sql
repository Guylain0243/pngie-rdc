CREATE TABLE acte_historique (
  id INTEGER PRIMARY KEY,
  acte_id TEXT NOT NULL REFERENCES acte_officiel(id),
  type_evenement TEXT NOT NULL,
  valeur_avant TEXT,
  valeur_apres TEXT,
  modifie_par TEXT REFERENCES personne(personne_id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_acte_historique_acte ON acte_historique(acte_id);
CREATE INDEX idx_acte_historique_modifie_par ON acte_historique(modifie_par);
