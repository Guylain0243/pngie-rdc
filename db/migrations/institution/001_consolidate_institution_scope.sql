\set ON_ERROR_STOP on
\echo ===== 001 - Consolidation institution_scope - PNGIE-RDC =====
\echo Remplace les 3 definitions concurrentes (01_securite_part3.sql,
\echo fix_institution_policy.sql, fix_institution_rls.sql) par une seule
\echo version de reference, versionnee, idempotente.
\echo
\echo Decision retenue (confirmee) : le scope national (PR/PM) passe par une
\echo institution racine explicite + hierarchie descendante (fn_institutions_descendantes),
\echo PAS par un institutionId NULL. La clause "OR ... IS NULL" presente dans
\echo fix_institution_policy.sql n'est donc pas necessaire et est retiree :
\echo en cas d'echec de resolution d'institution, l'acces est refuse
\echo (fail-closed) plutot qu'ouvert a tous (fail-open).
\echo

-- Precheck : etat actuel avant modification (pour trace / rollback eventuel)
\echo --- Etat AVANT modification ---
SELECT policyname, qual AS condition_using
FROM pg_policies
WHERE tablename = 'institution' AND policyname = 'institution_scope';

BEGIN;

DROP POLICY IF EXISTS institution_scope ON institution;

CREATE POLICY institution_scope ON institution
FOR ALL
USING (
    COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
    OR institution_id = (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
    OR institution_id IN (
        SELECT institution_id FROM fn_institutions_descendantes(
            (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
        )
    )
)
WITH CHECK (
    COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
    OR institution_id = (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
    OR institution_id IN (
        SELECT institution_id FROM fn_institutions_descendantes(
            (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
        )
    )
);

-- Sécurité : s'assurer que RLS est bien actif ET forcé (le propriétaire de la
-- table ne doit pas contourner silencieusement la policy).
ALTER TABLE institution ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution FORCE ROW LEVEL SECURITY;

COMMIT;

\echo --- Etat APRES modification ---
SELECT policyname, qual AS condition_using
FROM pg_policies
WHERE tablename = 'institution' AND policyname = 'institution_scope';

SELECT relname, relrowsecurity AS rls_active, relforcerowsecurity AS rls_forced
FROM pg_class WHERE relname = 'institution';

\echo
\echo ===== 001 TERMINE =====
\echo IMPORTANT : lancer la suite E2E complete (npm test) pour confirmer que
\echo rien ne depend implicitement de l'ancienne clause IS NULL avant de
\echo considerer ce chantier clos.
