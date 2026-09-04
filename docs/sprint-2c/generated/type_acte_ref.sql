CREATE TABLE type_acte_ref (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  ordre_affichage INTEGER NOT NULL DEFAULT 0,
  actif BOOLEAN NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
