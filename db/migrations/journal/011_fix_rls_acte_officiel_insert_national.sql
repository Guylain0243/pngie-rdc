-- db/migrations/journal/008_fix_rls_acte_officiel_insert_national.sql
-- Contexte : le WITH CHECK de la policy pol_acte_officiel_scope sur acte_officiel
-- ne tenait pas compte du scope national (app.lecture_nationale), contrairement
-- au USING de la meme policy. Un role a portee nationale (ex: PM, sans
-- scope_org_id propre dans person_role) ne pouvait donc pas creer d'acte au nom
-- d'une autre institution, alors qu'il le peut deja en lecture.
-- Confirme par le test E2E 007_journal_national.test.js : PM cree un acte
-- pour l'institution "Presidence de la Republique"
-- (97a5655b-bc17-4b5a-8da0-97201f3af843), qui n'est pas son institution propre.

ALTER POLICY pol_acte_officiel_scope ON acte_officiel
  USING (
    COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
    OR ((statut)::text = 'publie'::text AND (diffusion)::text = 'public'::text)
    OR institution_emettrice_id = (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
    OR current_setting('app.lecture_nationale', true) = 'true'
  )
  WITH CHECK (
    COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
    OR institution_emettrice_id = (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
    OR current_setting('app.lecture_nationale', true) = 'true'
  );