CREATE TABLE entity_event (
  event_id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  evenement TEXT NOT NULL,
  donnees_avant TEXT,
  donnees_apres TEXT,
  utilisateur_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
