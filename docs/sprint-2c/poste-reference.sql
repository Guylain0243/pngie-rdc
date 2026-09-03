-- Golden Reference
-- Table : poste
-- Source : PostgreSQL (pngie_rdc_rls_test, schema public)
-- Adaptation SQLite validee manuellement (Sprint 2C, Phase 1)
--
-- Verification effectuee a partir des extractions PostgreSQL :
--   - docs/phase5-colonnes-33-tables.txt
--   - docs/phase5-fk-33-tables.txt
--   - docs/phase5-pk-33-tables.txt
--
-- Toutes les contraintes, valeurs par defaut et nullabilites
-- proviennent directement de ces extractions.
--
-- Adaptations SQLite
--
-- UUID -> TEXT
-- uuid_generate_v4() supprime (poste_id : DEFAULT genere cote
--   PostgreSQL, volontairement omis ici)
-- timestamp with time zone -> TEXT DEFAULT (datetime('now'))
--
-- Ces adaptations suivent les conventions observees dans
-- db/schema.sqlite.sql (Sprint 2C, Phase 0 - voir
-- docs/sprint-2c/README.md pour le detail de l'audit).
--
-- Motif D (timestamp complet, sans institution_id)
-- Dependance : necessite que unite_organisationnelle soit creee avant poste

CREATE TABLE poste (
  poste_id TEXT PRIMARY KEY,
  unite_id TEXT NOT NULL REFERENCES unite_organisationnelle(unite_id),
  code TEXT NOT NULL,
  intitule TEXT NOT NULL,
  poste_hierarchique_id TEXT REFERENCES poste(poste_id),
  niveau_hierarchique INTEGER NOT NULL DEFAULT 0,
  categorie TEXT,
  missions TEXT,
  attributions TEXT,
  responsabilites TEXT,
  competences_requises TEXT,
  nombre_postes_autorises INTEGER NOT NULL DEFAULT 1,
  statut TEXT NOT NULL DEFAULT 'ACTIF',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  niveau_confiance TEXT NOT NULL DEFAULT 'A_VALIDER',
  pourcentage_confiance INTEGER,
  participe_calculs BOOLEAN
);
CREATE INDEX idx_poste_unite ON poste(unite_id);
CREATE INDEX idx_poste_hierarchique ON poste(poste_hierarchique_id);
