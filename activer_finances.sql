-- ============================================================================
-- PNGIE-RDC — Module Finances, Phase 1 : activation de ligne_budgetaire et
-- ecriture_comptable sur PostgreSQL
--
-- Contexte (diagnostic identique a celui mene pour dossier_agent_rh) :
--   - Les routeurs routes-generated/ligne_budgetaire.routes.js et
--     ecriture_comptable.routes.js existent, generes par government-builder.js,
--     mais leurs tables n'ont jamais ete creees dans PostgreSQL.
--   - ordre_paiement (troisieme entite Finances) est deja pleinement
--     operationnelle (18 lignes reelles, permissions MI en place) : sert de
--     modele de reference implicite pour la structure des permissions.
--   - Champs confirmes par lecture directe des routeurs (CHAMPS / CHAMPS_OBLIGATOIRES) :
--       ligne_budgetaire   : institution*, exercice*, programme, montant_alloue, statut
--       ecriture_comptable : compte*, libelle*, montant_debit, montant_credit, statut
--       (* = obligatoire cote routeur)
--   - Meme principe que dossier_agent_rh : colonnes texte libre (pas de FK
--     forcee vers institution/poste), pour rester fidele au contrat generique
--     du routeur existant sans le modifier.
--
-- Exécution : psql -f .\activer_finances.sql $env:PNGIE_ADMIN_DB_URL
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. TABLE ligne_budgetaire
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ligne_budgetaire (
    ligne_budgetaire_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    institution           TEXT NOT NULL,
    exercice              VARCHAR(4) NOT NULL,   -- annee budgetaire, ex: '2027'
    programme             TEXT,
    montant_alloue        NUMERIC(18,2),
    statut                VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',

    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE ligne_budgetaire IS
    'Ligne budgetaire par institution/exercice. Alimente routes-generated/ligne_budgetaire.routes.js. institution en texte libre (pas de FK forcee vers institution.institution_id), coherent avec le contrat du routeur genere.';

CREATE INDEX IF NOT EXISTS idx_ligne_budgetaire_exercice ON ligne_budgetaire (exercice);
CREATE INDEX IF NOT EXISTS idx_ligne_budgetaire_institution ON ligne_budgetaire (institution);
CREATE INDEX IF NOT EXISTS idx_ligne_budgetaire_statut ON ligne_budgetaire (statut);

CREATE OR REPLACE FUNCTION fn_ligne_budgetaire_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ligne_budgetaire_updated_at ON ligne_budgetaire;
CREATE TRIGGER trg_ligne_budgetaire_updated_at
    BEFORE UPDATE ON ligne_budgetaire
    FOR EACH ROW
    EXECUTE FUNCTION fn_ligne_budgetaire_set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. TABLE ecriture_comptable
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ecriture_comptable (
    ecriture_comptable_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    compte                  VARCHAR(20) NOT NULL,  -- numero de compte comptable
    libelle                 TEXT NOT NULL,
    montant_debit           NUMERIC(18,2),
    montant_credit          NUMERIC(18,2),
    statut                  VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE ecriture_comptable IS
    'Ecriture comptable (debit/credit). Alimente routes-generated/ecriture_comptable.routes.js.';

CREATE INDEX IF NOT EXISTS idx_ecriture_comptable_compte ON ecriture_comptable (compte);
CREATE INDEX IF NOT EXISTS idx_ecriture_comptable_statut ON ecriture_comptable (statut);

CREATE OR REPLACE FUNCTION fn_ecriture_comptable_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ecriture_comptable_updated_at ON ecriture_comptable;
CREATE TRIGGER trg_ecriture_comptable_updated_at
    BEFORE UPDATE ON ecriture_comptable
    FOR EACH ROW
    EXECUTE FUNCTION fn_ecriture_comptable_set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. METADONNEES meta_entity
-- ----------------------------------------------------------------------------
INSERT INTO meta_entity (nom_table, pk_column, libelle) VALUES
    ('ligne_budgetaire', 'ligne_budgetaire_id', 'Ligne Budgétaire'),
    ('ecriture_comptable', 'ecriture_comptable_id', 'Écriture Comptable')
ON CONFLICT (nom_table) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. PERMISSIONS — role MI, meme patron que ordre_paiement (deja en place)
--    CREATE / READ / UPDATE. Pas de DELETE par defaut.
-- ----------------------------------------------------------------------------
INSERT INTO permission (role_id, entite, action)
SELECT r.role_id, e.entite, a.action
FROM role r
CROSS JOIN (VALUES ('ligne_budgetaire'), ('ecriture_comptable')) AS e(entite)
CROSS JOIN (VALUES ('CREATE'), ('READ'), ('UPDATE')) AS a(action)
WHERE r.code = 'MI'
ON CONFLICT (role_id, entite, action) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. VERIFICATION
-- ----------------------------------------------------------------------------
\echo ''
\echo '=== Tables creees ==='
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('ligne_budgetaire', 'ecriture_comptable')
ORDER BY table_name, ordinal_position;

\echo ''
\echo '=== Metadonnees meta_entity ==='
SELECT nom_table, pk_column, libelle FROM meta_entity
WHERE nom_table IN ('ligne_budgetaire', 'ecriture_comptable');

\echo ''
\echo '=== Permissions accordees ==='
SELECT r.code AS role, p.entite, p.action, p.statut
FROM permission p JOIN role r ON r.role_id = p.role_id
WHERE p.entite IN ('ligne_budgetaire', 'ecriture_comptable')
ORDER BY p.entite, p.action;

COMMIT;

\echo ''
\echo '=== FIN ACTIVATION MODULE FINANCES ==='
