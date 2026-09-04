CREATE TABLE verification (
  verification_id TEXT PRIMARY KEY,
  rapport_id TEXT NOT NULL REFERENCES execution_rapport(rapport_id),
  verificateur_person_id TEXT,
  verificateur_institution_id TEXT NOT NULL REFERENCES institution(institution_id),
  decision TEXT NOT NULL,
  commentaire TEXT,
  date_verification TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_verification_rapport ON verification(rapport_id);
CREATE INDEX idx_verification_verificateur_institution ON verification(verificateur_institution_id);
