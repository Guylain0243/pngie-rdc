-- ============================================================
-- 006_fix_rls_journal_scope_national.sql
-- Correctif : le WITH CHECK de pol_acte_officiel_scope rejetait toute
-- ecriture des comptes a portee nationale (scope_institution_id NULL,
-- donc app.current_institution_id jamais peuplee). On aligne sur le
-- pattern deja utilise par institution_scope : NULLIF(...) IS NULL
-- -> acces large autorise.
-- ============================================================

BEGIN;

DROP POLICY IF EXISTS pol_acte_officiel_scope ON acte_officiel;

CREATE POLICY pol_acte_officiel_scope ON acte_officiel
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR (statut = 'publie' AND diffusion = 'public')
        OR NULLIF(current_setting('app.current_institution_id', true), '') IS NULL
        OR institution_emettrice_id = (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR NULLIF(current_setting('app.current_institution_id', true), '') IS NULL
        OR institution_emettrice_id = (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
    );

COMMIT;
