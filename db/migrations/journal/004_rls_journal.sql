-- ============================================================
-- 004_rls_journal.sql (v2 — aligné sur le pattern RLS réel existant)
-- ============================================================

BEGIN;

ALTER TABLE acte_officiel ENABLE ROW LEVEL SECURITY;
ALTER TABLE acte_signature ENABLE ROW LEVEL SECURITY;
ALTER TABLE acte_piece_jointe ENABLE ROW LEVEL SECURITY;
ALTER TABLE acte_historique ENABLE ROW LEVEL SECURITY;

CREATE POLICY pol_acte_officiel_scope ON acte_officiel
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR (statut = 'publie' AND diffusion = 'public')
        OR institution_emettrice_id = (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR institution_emettrice_id = (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
    );

CREATE POLICY pol_acte_signature_scope ON acte_signature
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR acte_id IN (SELECT id FROM acte_officiel)
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR acte_id IN (SELECT id FROM acte_officiel)
    );

CREATE POLICY pol_acte_piece_jointe_scope ON acte_piece_jointe
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR acte_id IN (SELECT id FROM acte_officiel)
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR acte_id IN (SELECT id FROM acte_officiel)
    );

CREATE POLICY pol_acte_historique_lecture ON acte_historique
    FOR SELECT
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR acte_id IN (SELECT id FROM acte_officiel)
    );

CREATE POLICY pol_acte_historique_ecriture ON acte_historique
    FOR INSERT
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR acte_id IN (SELECT id FROM acte_officiel)
    );

COMMIT;
