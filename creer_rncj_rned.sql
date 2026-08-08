-- ============================================================================
-- PNGIE-RDC — RNCJ (Casier Judiciaire) + RNED (Exécution des Décisions)
-- Tome J13.
--
-- ⚠️ NATURE DIFFÉRENTE des référentiels précédents (RNTGI, RNTP, RNG, RNP...) :
-- ceux-ci étaient des référentiels INSTITUTIONNELS (une ligne par juridiction/
-- greffe/parquet). Le RNCJ et le RNED sont des référentiels de DONNÉES
-- OPÉRATIONNELLES (une ligne par personne / par décision judiciaire),
-- de même famille que le RNA, RNACOM, RNAS, RNPJE, RNAJ laissés de côté
-- jusqu'ici. Créés ici à la demande explicite de l'utilisateur.
--
-- Confidentialité renforcée requise (Tome J13, §11) : ces tables contiennent
-- des données pénales sensibles liées à des personnes physiques. Le contrôle
-- d'accès (RBAC/ABAC) et le chiffrement doivent être appliqués au niveau
-- applicatif — non couverts par ce DDL, qui ne pose que la structure.
--
-- Exécution : psql -f .\creer_rncj_rned.sql $env:PNGIE_ADMIN_DB_URL
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. RNCJ — Casier Judiciaire (une ligne par personne)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ref_casier_judiciaire (
    ini                   VARCHAR(20) PRIMARY KEY,  -- ex: CJ-000001
    personne_id           UUID,                      -- référence vers le registre national des personnes (table personne), non contrainte en FK ici par prudence de schéma
    identifiant_national  VARCHAR(50),
    statut                VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
                              CHECK (statut IN ('ACTIF','EFFACE','REHABILITE','SUSPENDU')),
    date_creation         DATE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Condamnations rattachées à un casier (plusieurs par personne)
CREATE TABLE IF NOT EXISTS ref_condamnation (
    id                    SERIAL PRIMARY KEY,
    casier_ini            VARCHAR(20) NOT NULL REFERENCES ref_casier_judiciaire(ini),
    juridiction_code      VARCHAR(20),               -- institution.code de la juridiction ayant rendu la décision
    reference_decision    VARCHAR(255),
    date_decision         DATE,
    caractere_definitif   BOOLEAN NOT NULL DEFAULT false,
    nature                TEXT,
    etat_execution        VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
                              CHECK (etat_execution IN ('EN_ATTENTE','EN_COURS','EXECUTEE','SUSPENDUE')),
    date_execution        DATE,
    reference_acte        VARCHAR(255),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Réhabilitations / effacements légaux (historique distinct, jamais de suppression physique)
CREATE TABLE IF NOT EXISTS ref_casier_historique (
    id               SERIAL PRIMARY KEY,
    casier_ini       VARCHAR(20) NOT NULL,
    type_evenement   VARCHAR(30) NOT NULL,  -- INSCRIPTION, REHABILITATION, EFFACEMENT_LEGAL, MODIFICATION
    ancienne_valeur  JSONB,
    nouvelle_valeur  JSONB,
    reference_acte   VARCHAR(255),
    commentaire      TEXT,
    date_evenement   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. RNED — Exécution des Décisions (une ligne par décision judiciaire)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ref_execution_decision (
    ini                       VARCHAR(20) PRIMARY KEY,  -- ex: EXEC-000001
    juridiction_code          VARCHAR(20),               -- institution.code de la juridiction
    reference_decision        VARCHAR(255) NOT NULL,
    date_decision             DATE,
    caractere_definitif       BOOLEAN NOT NULL DEFAULT false,
    autorite_execution        TEXT,                      -- ex: Parquet, Trésor (amendes), administration pénitentiaire
    type_execution            VARCHAR(30)
                                  CHECK (type_execution IN ('CIVILE','PENALE','AMENDE','FRAIS_JUDICIAIRES','MESURE_SURETE','REHABILITATION')),
    etat_execution            VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
                                  CHECK (etat_execution IN ('EN_ATTENTE','EN_COURS','EXECUTEE','SUSPENDUE')),
    reference_acte            VARCHAR(255),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ref_execution_historique (
    id               SERIAL PRIMARY KEY,
    ini              VARCHAR(20) NOT NULL,
    type_evenement   VARCHAR(30) NOT NULL,  -- INSCRIPTION, MISE_EN_EXECUTION, EXECUTION, SUSPENSION, CLOTURE
    ancienne_valeur  JSONB,
    nouvelle_valeur  JSONB,
    reference_acte   VARCHAR(255),
    commentaire      TEXT,
    date_evenement   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. Contrôle
-- ----------------------------------------------------------------------------
SELECT
    (SELECT COUNT(*) FROM ref_casier_judiciaire)   AS nb_casiers,
    (SELECT COUNT(*) FROM ref_condamnation)        AS nb_condamnations,
    (SELECT COUNT(*) FROM ref_execution_decision)  AS nb_executions;

COMMIT;
\echo '=== RNCJ + RNED créés (Tome J13) — tables vides ==='
\echo 'RAPPEL : contrôle d''accès renforcé (RBAC/ABAC, chiffrement) à implémenter au niveau applicatif.'
\echo 'personne_id n''est PAS contraint en FK ici (schéma exact de la table personne non confirmé) — à lier une fois vérifié.'
