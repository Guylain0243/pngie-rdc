CREATE TABLE execution_rapport (
  rapport_id TEXT PRIMARY KEY,
  instruction_id TEXT NOT NULL REFERENCES instruction(instruction_id),
  institution_id TEXT NOT NULL REFERENCES institution(institution_id),
  redacteur_person_id TEXT,
  contenu TEXT NOT NULL,
  taux_avancement INTEGER NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'SOUMIS',
  date_rapport TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_execution_rapport_instruction ON execution_rapport(instruction_id);
CREATE INDEX idx_execution_rapport_institution ON execution_rapport(institution_id);
