-- ============================================================================
-- PNGIE-RDC — Module RH, Phase 1 : activation de dossier_agent_rh sur PostgreSQL
--
-- Contexte (diagnostic complet mene en conversation) :
--   - Le routeur routes-generated/dossier_agent_rh.routes.js existe et est deja
--     monte dans server.js (app.use('/api', dossierAgentRhRouter)) mais la
--     table dossier_agent_rh elle-meme n'a jamais ete creee dans PostgreSQL
--     (seulement testee autrefois contre l'ancien SQLite de dev).
--   - government-builder.js genere du SQL de style SQLite (TEXT PRIMARY KEY,
--     TEXT DEFAULT CURRENT_TIMESTAMP) : on ne le relance PAS contre Postgres.
--     Cette table est donc creee ici a la main, avec de vrais types Postgres,
--     mais des noms de colonnes IDENTIQUES a ceux attendus par le routeur
--     existant (dossier_agent_rh_id, agent_concerne, type_mouvement,
--     poste_vise, statut, created_at, updated_at) — aucune modification du
--     routeur n'est necessaire.
--   - meta_entity existe (4 colonnes reelles : entity_id, nom_table,
--     pk_column, libelle, created_at) : on y insere la ligne pour tracabilite.
--   - meta_attribute N'EXISTE PAS en Postgres : non recreee ici, hors
--     perimetre de cette activation (uniquement lue par government-builder.js,
--     jamais par les routes elles-memes).
--   - permission(role_id, entite, action) confirmee reelle et deja utilisee
--     par exigerPermission() dans security-engine.js. On suit exactement le
--     patron observe sur l'entite ordre_paiement (role MI : CREATE/READ/UPDATE,
--     pas de DELETE par defaut).
--
-- Exécution : psql -f .\activer_dossier_agent_rh.sql $env:PNGIE_ADMIN_DB_URL
-- (ADMIN recommande pour la creation de table, comme pour le RNSJ)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. TABLE dossier_agent_rh (types PostgreSQL natifs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dossier_agent_rh (
    dossier_agent_rh_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Champs identiques a ceux attendus par routes-generated/dossier_agent_rh.routes.js
    -- (CHAMPS = ["agent_concerne","type_mouvement","poste_vise","statut"]).
    -- Stockes en texte libre (pas de FK forcee vers person/poste) car le routeur
    -- generique ne fait aucune hypothese de type sur ces champs — a faire evoluer
    -- vers une vraie FK (ex: poste_vise -> poste.poste_id) uniquement si vous
    -- validez ce choix, pour ne pas casser le routeur existant entre-temps.
    agent_concerne       TEXT NOT NULL,
    type_mouvement       VARCHAR(50) NOT NULL,
    poste_vise            TEXT,
    statut                VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',

    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE dossier_agent_rh IS
    'Suivi des mouvements de personnel (mutation, nomination, promotion...). Alimente routes-generated/dossier_agent_rh.routes.js. Types Postgres natifs ; noms de colonnes strictement identiques a ceux attendus par le routeur existant.';

CREATE INDEX IF NOT EXISTS idx_dossier_agent_rh_statut ON dossier_agent_rh (statut);
CREATE INDEX IF NOT EXISTS idx_dossier_agent_rh_created ON dossier_agent_rh (created_at DESC);

-- Trigger updated_at (meme pattern que le RNSJ)
CREATE OR REPLACE FUNCTION fn_dossier_agent_rh_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dossier_agent_rh_updated_at ON dossier_agent_rh;
CREATE TRIGGER trg_dossier_agent_rh_updated_at
    BEFORE UPDATE ON dossier_agent_rh
    FOR EACH ROW
    EXECUTE FUNCTION fn_dossier_agent_rh_set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. METADONNEE meta_entity (tracabilite, coherence avec le systeme existant)
--    Schema reel confirme : entity_id, nom_table (UNIQUE), pk_column, libelle
-- ----------------------------------------------------------------------------
INSERT INTO meta_entity (nom_table, pk_column, libelle)
VALUES ('dossier_agent_rh', 'dossier_agent_rh_id', 'Dossier Agent — Mouvement RH')
ON CONFLICT (nom_table) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. PERMISSIONS — role MI (Ministeres), meme patron que ordre_paiement
--    CREATE / READ / UPDATE. Pas de DELETE par defaut (coherent avec le reste
--    du projet : aucune suppression physique sans decision explicite).
-- ----------------------------------------------------------------------------
INSERT INTO permission (role_id, entite, action)
SELECT r.role_id, 'dossier_agent_rh', a.action
FROM role r
CROSS JOIN (VALUES ('CREATE'), ('READ'), ('UPDATE')) AS a(action)
WHERE r.code = 'MI'
ON CONFLICT (role_id, entite, action) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. VERIFICATION
-- ----------------------------------------------------------------------------
\echo ''
\echo '=== Table creee ==='
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'dossier_agent_rh' ORDER BY ordinal_position;

\echo ''
\echo '=== Metadonnee meta_entity ==='
SELECT nom_table, pk_column, libelle FROM meta_entity WHERE nom_table = 'dossier_agent_rh';

\echo ''
\echo '=== Permissions accordees ==='
SELECT r.code AS role, p.entite, p.action, p.statut
FROM permission p JOIN role r ON r.role_id = p.role_id
WHERE p.entite = 'dossier_agent_rh'
ORDER BY p.action;

COMMIT;

\echo ''
\echo '=== FIN ACTIVATION dossier_agent_rh ==='
