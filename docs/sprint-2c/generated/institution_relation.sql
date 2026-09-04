CREATE TABLE institution_relation (
  institution_relation_id TEXT PRIMARY KEY,
  institution_source_id TEXT NOT NULL REFERENCES institution(institution_id),
  institution_cible_id TEXT NOT NULL REFERENCES institution(institution_id),
  type_relation TEXT NOT NULL REFERENCES relation_type(code),
  priorite INTEGER DEFAULT 0,
  date_debut TEXT DEFAULT (date('now')),
  date_fin TEXT,
  actif BOOLEAN DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_institution_relation_institution_source ON institution_relation(institution_source_id);
CREATE INDEX idx_institution_relation_institution_cible ON institution_relation(institution_cible_id);
CREATE INDEX idx_institution_relation_type_relation ON institution_relation(type_relation);
