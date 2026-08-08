-- ============================================================================
-- PNGIE-RDC — Référentiel National des Parquets (RNP)
-- Tome J11. Composant TRANSVERSAL du Ministère Public (pas une juridiction) :
-- couvre les Parquets Généraux près les Cours d'Appel (déjà représentés comme
-- unités PARQUET_GEN internes aux 27 institutions CA_*) et les futurs
-- Parquets près les Tribunaux de Grande Instance et juridictions spécialisées.
-- Table vide à l'initialisation, aucune hypothèse sur le nombre total.
--
-- Modèle institutionnel de référence (Tome J11, §3-4) :
--   Direction : Procureur Général (niveau CA) ou Procureur de la République (niveau TGI)
--   Magistrats : Premiers Avocats Généraux / Avocats Généraux (CA)
--                ou Premiers Substituts / Substituts (TGI)
--   Greffe du Parquet : Greffier en Chef, Greffiers
--
-- Exécution : psql -f .\creer_referentiel_parquets.sql $env:PNGIE_ADMIN_DB_URL
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS ref_parquet (
    ini                       VARCHAR(20) PRIMARY KEY,  -- ex: PARQ-001
    code_institution          VARCHAR(20),               -- lien vers institution.code si le parquet est modélisé comme institution distincte
    institution_id            UUID REFERENCES institution(institution_id),
    unite_id                  UUID REFERENCES unite_organisationnelle(unite_id), -- ex: pour les PARQUET_GEN déjà internes aux CA_*
    denomination_officielle   VARCHAR(255) NOT NULL,
    type_parquet              VARCHAR(30) NOT NULL
                                  CHECK (type_parquet IN ('PARQUET_GENERAL_CA','PARQUET_TGI','PARQUET_SPECIALISE')),
    juridiction_rattachement  VARCHAR(20),               -- code de la juridiction de rattachement (CA_xxx, TGI ini, etc.)
    ressort_territorial       TEXT,
    procureur_responsable_nom TEXT,
    greffe_nom                TEXT,
    date_creation             DATE,
    reference_acte_juridique  VARCHAR(255),
    statut                    VARCHAR(20) NOT NULL DEFAULT 'A_VALIDER'
                                  CHECK (statut IN ('A_VALIDER','ACTIVE','SUSPENDUE','FUSIONNEE','SUPPRIMEE')),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ref_parquet_historique (
    id               SERIAL PRIMARY KEY,
    ini              VARCHAR(20) NOT NULL,
    type_evenement   VARCHAR(30) NOT NULL,
    ancienne_valeur  JSONB,
    nouvelle_valeur  JSONB,
    reference_acte   VARCHAR(255),
    commentaire      TEXT,
    date_evenement   TIMESTAMPTZ NOT NULL DEFAULT now()
);

SELECT COUNT(*) AS nb_parquets_enregistres FROM ref_parquet;

COMMIT;
\echo '=== RNP créé (Tome J11) — table vide, aucun parquet enregistré, aucune hypothèse de nombre ==='
\echo 'RAPPEL : les Parquets Généraux près les 27 Cours d''Appel existent déjà comme unités PARQUET_GEN internes.'
\echo 'Ils pourront être référencés dans le RNP via unite_id, sans duplication, si besoin plus tard.'
