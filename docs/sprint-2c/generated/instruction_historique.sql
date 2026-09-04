CREATE TABLE instruction_historique (
  historique_id TEXT PRIMARY KEY,
  instruction_id TEXT NOT NULL REFERENCES instruction(instruction_id),
  ancien_statut TEXT,
  nouveau_statut TEXT NOT NULL,
  person_id TEXT,
  commentaire TEXT,
  date_changement TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_instruction_historique_instruction ON instruction_historique(instruction_id);
