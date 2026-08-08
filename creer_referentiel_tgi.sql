-- ============================================================================
-- PNGIE-RDC — Référentiel National des Tribunaux de Grande Instance (RNTGI)
-- Tome J6. Table vide à l'initialisation, sur le même principe que
-- ref_juridiction_militaire (justice militaire) : aucune hypothèse sur le
-- nombre total de TGI, alimentation progressive après vérification des
-- textes officiels (Loi organique n°13/011-B du 11/04/2013 et actes
-- d'organisation judiciaire successifs).
--
-- Modèle institutionnel de référence (Tome J6, sections 3-5), à appliquer
-- identiquement à chaque TGI une fois créé comme institution réelle, sur le
-- même schéma que celui utilisé pour les 26 TMG (Tome 16) :
--   PRESIDENCE   (Président)
--   SIEGE        (Juges)
--   PARQUET      (Procureur de la République, Premiers Substituts, Substituts)
--   GREFFE       (Greffier en Chef, Greffiers)
-- Ce modèle n'est pas instancié ici — seul le référentiel est créé.
--
-- Exécution : psql -f .\creer_referentiel_tgi.sql $env:PNGIE_ADMIN_DB_URL
-- (CREATE TABLE nécessite les droits admin, comme pour les référentiels
-- précédents)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Référentiel des Tribunaux de Grande Instance
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ref_tribunal_grande_instance (
    ini                       VARCHAR(20) PRIMARY KEY,  -- ex: TGI-001
    code_institution          VARCHAR(20),               -- lien vers institution.code une fois l'institution réellement créée
    institution_id            UUID REFERENCES institution(institution_id),
    denomination_officielle   VARCHAR(255) NOT NULL,
    ressort_territorial       TEXT,
    province                  VARCHAR(100),
    ville_siege                VARCHAR(100),
    cour_appel_rattachement   VARCHAR(20),               -- code de la CA_xxx de rattachement
    chambres_instituees       TEXT,
    effectif_siege            INTEGER,
    effectif_parquet          INTEGER,
    effectif_greffe           INTEGER,
    president_nom             TEXT,                      -- champ libre, pas de lien direct au référentiel personne
    procureur_republique_nom  TEXT,
    greffier_chef_nom         TEXT,
    date_creation              DATE,
    reference_acte_juridique  VARCHAR(255),
    statut                    VARCHAR(20) NOT NULL DEFAULT 'A_VALIDER'
                                  CHECK (statut IN ('A_VALIDER','ACTIVE','SUSPENDUE','FUSIONNEE','SUPPRIMEE')),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. Historisation (aucune donnée n'est jamais supprimée, tout est tracé)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ref_tgi_historique (
    id               SERIAL PRIMARY KEY,
    ini              VARCHAR(20) NOT NULL,
    type_evenement   VARCHAR(30) NOT NULL,  -- CREATION, MODIFICATION, FUSION, SUPPRESSION, CHANGEMENT_RESSORT, VALIDATION
    ancienne_valeur  JSONB,
    nouvelle_valeur  JSONB,
    reference_acte   VARCHAR(255),
    commentaire      TEXT,
    date_evenement   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. Contrôle : la table doit exister et être vide (aucune donnée insérée ici)
-- ----------------------------------------------------------------------------
SELECT COUNT(*) AS nb_tgi_enregistres FROM ref_tribunal_grande_instance;

COMMIT;
\echo '=== RNTGI créé (Tome J6) — table vide, aucun TGI enregistré, aucune hypothèse de nombre ==='
\echo 'Prochaine étape : alimenter au fur et à mesure de la vérification des actes officiels.'
