-- ============================================================================
-- PNGIE-RDC — Référentiel National des Greffes (RNG)
-- Tome J12. Composant TRANSVERSAL. Les Greffes existent déjà comme unités
-- internes de chaque juridiction (GREFFE, GREFFE-CC, GREFFE-CASS, GREFFE-CE,
-- et dans chaque CA_* / TMG_* / AUD_CM*). Ce référentiel ne duplique pas ces
-- unités — il permet de les recenser au niveau national via unite_id,
-- et d'accueillir les greffes des futures juridictions (TGI, TP, TC, TT, TE)
-- au fur et à mesure de leur création.
--
-- Le RNAJ (Référentiel National des Actes Judiciaires) n'est PAS créé ici :
-- c'est un référentiel documentaire/opérationnel (comme RNA, RNACOM, RNAS,
-- RNPJE des tomes précédents), hors du périmètre institutionnel traité
-- jusqu'ici.
--
-- Exécution : psql -f .\creer_referentiel_greffes.sql $env:PNGIE_ADMIN_DB_URL
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS ref_greffe (
    ini                       VARCHAR(20) PRIMARY KEY,  -- ex: GRF-001
    code_institution          VARCHAR(20),               -- code de l'institution si le greffe a son propre enregistrement institution
    institution_id            UUID REFERENCES institution(institution_id), -- institution de la juridiction (CA_xxx, HAUTE_COUR_MILITAIRE, etc.)
    unite_id                  UUID REFERENCES unite_organisationnelle(unite_id), -- unité Greffe existante (ex: GREFFE-CC, GREFFE-CASS...)
    denomination_officielle   VARCHAR(255) NOT NULL,
    juridiction_rattachement  VARCHAR(20),               -- code de la juridiction (institution.code)
    ressort_territorial       TEXT,
    greffier_chef_nom         TEXT,
    effectifs_greffiers       INTEGER,
    organisation_interne      TEXT,                      -- Bureau d'enrôlement, des audiences, des archives, des expéditions, etc.
    date_creation             DATE,
    reference_acte_juridique  VARCHAR(255),
    statut                    VARCHAR(20) NOT NULL DEFAULT 'A_VALIDER'
                                  CHECK (statut IN ('A_VALIDER','ACTIVE','SUSPENDUE','FUSIONNEE','SUPPRIMEE')),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ref_greffe_historique (
    id               SERIAL PRIMARY KEY,
    ini              VARCHAR(20) NOT NULL,
    type_evenement   VARCHAR(30) NOT NULL,
    ancienne_valeur  JSONB,
    nouvelle_valeur  JSONB,
    reference_acte   VARCHAR(255),
    commentaire      TEXT,
    date_evenement   TIMESTAMPTZ NOT NULL DEFAULT now()
);

SELECT COUNT(*) AS nb_greffes_enregistres FROM ref_greffe;

COMMIT;
\echo '=== RNG créé (Tome J12) — table vide, aucun greffe enregistré ==='
\echo 'RAPPEL : les greffes existants (GREFFE-CC, GREFFE-CASS, GREFFE-CE, GREFFE des 27 CA...)'
\echo 'ne sont PAS dupliqués ici. Ils pourront être référencés via unite_id si besoin plus tard.'
\echo 'RNAJ (actes judiciaires) non créé — référentiel documentaire hors périmètre institutionnel.'
