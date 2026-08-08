-- ============================================================================
-- PNGIE-RDC — Référentiel National des Tribunaux de Paix (RNTP)
-- Tome J7. Table vide à l'initialisation, même principe que le RNTGI :
-- aucune hypothèse sur le nombre total, alimentation progressive après
-- vérification des actes officiels de création.
--
-- Modèle institutionnel de référence (Tome J7, sections 3-5), à appliquer
-- identiquement à chaque Tribunal de Paix une fois créé comme institution
-- réelle :
--   PRESIDENCE (Président)
--   SIEGE      (Juges)
--   PARQUET    (Procureur de la République, Premiers Substituts, Substituts)
--   GREFFE     (Greffier en Chef, Greffiers)
-- Ce modèle n'est pas instancié ici — seul le référentiel est créé.
--
-- Exécution : psql -f .\creer_referentiel_tribunaux_paix.sql $env:PNGIE_ADMIN_DB_URL
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS ref_tribunal_paix (
    ini                       VARCHAR(20) PRIMARY KEY,  -- ex: TP-001
    code_institution          VARCHAR(20),
    institution_id            UUID REFERENCES institution(institution_id),
    denomination_officielle   VARCHAR(255) NOT NULL,
    ressort_territorial       TEXT,
    province                  VARCHAR(100),
    ville_siege               VARCHAR(100),
    tgi_rattachement          VARCHAR(20),   -- code du TGI de rattachement (ref_tribunal_grande_instance.ini)
    cour_appel_rattachement   VARCHAR(20),   -- code de la CA_xxx de rattachement
    president_nom             TEXT,
    procureur_republique_nom  TEXT,
    greffier_chef_nom         TEXT,
    date_creation             DATE,
    reference_acte_juridique  VARCHAR(255),
    statut                    VARCHAR(20) NOT NULL DEFAULT 'A_VALIDER'
                                  CHECK (statut IN ('A_VALIDER','ACTIVE','SUSPENDUE','FUSIONNEE','SUPPRIMEE')),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ref_tribunal_paix_historique (
    id               SERIAL PRIMARY KEY,
    ini              VARCHAR(20) NOT NULL,
    type_evenement   VARCHAR(30) NOT NULL,
    ancienne_valeur  JSONB,
    nouvelle_valeur  JSONB,
    reference_acte   VARCHAR(255),
    commentaire      TEXT,
    date_evenement   TIMESTAMPTZ NOT NULL DEFAULT now()
);

SELECT COUNT(*) AS nb_tp_enregistres FROM ref_tribunal_paix;

COMMIT;
\echo '=== RNTP créé (Tome J7) — table vide, aucun Tribunal de Paix enregistré, aucune hypothèse de nombre ==='
