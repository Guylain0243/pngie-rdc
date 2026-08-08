-- ============================================================
-- MIGRATION : Referentiel National des Institutions - PNGIE-RDC
-- Phase 1 : Institutions + Organismes sous tutelle + Comptes
-- ============================================================

-- Table principale : hierarchie institutionnelle recursive
-- Un ministere, une direction generale, une agence, un office,
-- un programme, une ecole... sont tous des lignes de cette
-- meme table, relies entre eux par parent_id.
CREATE TABLE IF NOT EXISTS institutions (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    nom                   TEXT NOT NULL,
    sigle                 TEXT,
    type                  TEXT NOT NULL CHECK (type IN (
                              'presidence',
                              'primature',
                              'senat',
                              'assemblee_nationale',
                              'ministere',
                              'cabinet',
                              'secretariat_general',
                              'direction_generale',
                              'direction',
                              'division',
                              'service',
                              'inspection',
                              'agence_nationale',
                              'etablissement_public',
                              'office_national',
                              'autorite_regulation',
                              'fonds_national',
                              'programme_national',
                              'entreprise_publique',
                              'service_provincial',
                              'ecole_institut',
                              'laboratoire',
                              'hopital_centre_hospitalier'
                          )),
    parent_id             INTEGER,
    ministere_racine_id   INTEGER,
    mission               TEXT,
    vision                TEXT,
    attributions          TEXT,
    date_creation_reelle  TEXT,
    statut                TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif','inactif','en_creation','dissous')),
    created_at            TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at            TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (parent_id) REFERENCES institutions(id) ON DELETE SET NULL,
    FOREIGN KEY (ministere_racine_id) REFERENCES institutions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_institutions_parent ON institutions(parent_id);
CREATE INDEX IF NOT EXISTS idx_institutions_ministere_racine ON institutions(ministere_racine_id);
CREATE INDEX IF NOT EXISTS idx_institutions_type ON institutions(type);
CREATE INDEX IF NOT EXISTS idx_institutions_sigle ON institutions(sigle);

-- Table des comptes de connexion, un compte par organisme
-- (chaque organisme, quel que soit son niveau, peut avoir
-- son propre acces au systeme)
CREATE TABLE IF NOT EXISTS comptes_institution (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    institution_id   INTEGER NOT NULL,
    identifiant      TEXT NOT NULL UNIQUE,
    mot_de_passe_hash TEXT NOT NULL,
    salt             TEXT NOT NULL,
    role             TEXT NOT NULL DEFAULT 'organisme' CHECK (role IN (
                          'super_admin','ministere','organisme','lecture_seule'
                      )),
    actif            INTEGER NOT NULL DEFAULT 1,
    derniere_connexion TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comptes_institution_id ON comptes_institution(institution_id);
CREATE INDEX IF NOT EXISTS idx_comptes_identifiant ON comptes_institution(identifiant);
