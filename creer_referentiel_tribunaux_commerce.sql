-- ============================================================================
-- PNGIE-RDC — Référentiel National des Tribunaux de Commerce (RNTC)
-- Tome J8. Table vide à l'initialisation, aucune hypothèse sur le nombre
-- total, alimentation progressive après vérification des actes officiels.
--
-- Modèle institutionnel de référence (Tome J8, sections 3-5) :
--   PRESIDENCE     (Président, Vice-Présidents selon organisation)
--   SIEGE          (Juges, Juges consulaires)
--   GREFFE         (Greffier en Chef, Greffiers)
--   ADMINISTRATION
-- Ce modèle n'est pas instancié ici — seul le référentiel est créé.
--
-- Exécution : psql -f .\creer_referentiel_tribunaux_commerce.sql $env:PNGIE_ADMIN_DB_URL
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS ref_tribunal_commerce (
    ini                       VARCHAR(20) PRIMARY KEY,  -- ex: TCOM-001
    code_institution          VARCHAR(20),
    institution_id            UUID REFERENCES institution(institution_id),
    denomination_officielle   VARCHAR(255) NOT NULL,
    ressort_territorial       TEXT,
    province                  VARCHAR(100),
    ville_siege               VARCHAR(100),
    cour_appel_rattachement   VARCHAR(20),   -- code de la CA_xxx de rattachement
    chambres_specialisees     TEXT,
    president_nom             TEXT,
    greffier_chef_nom         TEXT,
    date_creation             DATE,
    reference_acte_juridique  VARCHAR(255),
    statut                    VARCHAR(20) NOT NULL DEFAULT 'A_VALIDER'
                                  CHECK (statut IN ('A_VALIDER','ACTIVE','SUSPENDUE','FUSIONNEE','SUPPRIMEE')),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ref_tribunal_commerce_historique (
    id               SERIAL PRIMARY KEY,
    ini              VARCHAR(20) NOT NULL,
    type_evenement   VARCHAR(30) NOT NULL,
    ancienne_valeur  JSONB,
    nouvelle_valeur  JSONB,
    reference_acte   VARCHAR(255),
    commentaire      TEXT,
    date_evenement   TIMESTAMPTZ NOT NULL DEFAULT now()
);

SELECT COUNT(*) AS nb_tcom_enregistres FROM ref_tribunal_commerce;

COMMIT;
\echo '=== RNTC créé (Tome J8) — table vide, aucun Tribunal de Commerce enregistré, aucune hypothèse de nombre ==='
