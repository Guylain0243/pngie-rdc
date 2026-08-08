-- ============================================================================
-- PNGIE-RDC — Référentiel National des Tribunaux pour Enfants (RNTE)
-- Tome J10. Table vide à l'initialisation, aucune hypothèse sur le nombre
-- total, alimentation progressive après vérification des actes officiels.
--
-- Modèle institutionnel de référence (Tome J10, sections 3-5) :
--   PRESIDENCE (Président)
--   SIEGE      (Juges spécialisés)
--   PARQUET    (Ministère Public : Magistrat + Substituts)
--   GREFFE     (Greffier en Chef, Greffiers)
-- Ce modèle n'est pas instancié ici — seul le référentiel est créé.
--
-- Point de vigilance (Tome J10, §13) : les données relatives aux mineurs
-- bénéficient de règles de confidentialité renforcées. Ce référentiel ne
-- stocke aucune donnée d'affaire individuelle (cf. RNPJE distinct, non créé
-- ici) — uniquement les métadonnées institutionnelles du tribunal lui-même.
--
-- Exécution : psql -f .\creer_referentiel_tribunaux_enfants.sql $env:PNGIE_ADMIN_DB_URL
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS ref_tribunal_enfants (
    ini                       VARCHAR(20) PRIMARY KEY,  -- ex: TENF-001
    code_institution          VARCHAR(20),
    institution_id            UUID REFERENCES institution(institution_id),
    denomination_officielle   VARCHAR(255) NOT NULL,
    ressort_territorial       TEXT,
    province                  VARCHAR(100),
    ville_siege               VARCHAR(100),
    cour_appel_rattachement   VARCHAR(20),   -- code de la CA_xxx de rattachement
    tgi_rattachement          VARCHAR(20),   -- code du TGI de rattachement, si applicable
    president_nom             TEXT,
    ministere_public_nom      TEXT,
    greffier_chef_nom         TEXT,
    date_creation             DATE,
    reference_acte_juridique  VARCHAR(255),
    statut                    VARCHAR(20) NOT NULL DEFAULT 'A_VALIDER'
                                  CHECK (statut IN ('A_VALIDER','ACTIVE','SUSPENDUE','FUSIONNEE','SUPPRIMEE')),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ref_tribunal_enfants_historique (
    id               SERIAL PRIMARY KEY,
    ini              VARCHAR(20) NOT NULL,
    type_evenement   VARCHAR(30) NOT NULL,
    ancienne_valeur  JSONB,
    nouvelle_valeur  JSONB,
    reference_acte   VARCHAR(255),
    commentaire      TEXT,
    date_evenement   TIMESTAMPTZ NOT NULL DEFAULT now()
);

SELECT COUNT(*) AS nb_tenf_enregistres FROM ref_tribunal_enfants;

COMMIT;
\echo '=== RNTE créé (Tome J10) — table vide, aucun Tribunal pour Enfants enregistré, aucune hypothèse de nombre ==='
