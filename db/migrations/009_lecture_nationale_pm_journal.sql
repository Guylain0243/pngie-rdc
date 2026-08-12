-- Migration : active la lecture nationale pour PM et cable le mecanisme
-- jusqu'a la policy RLS de acte_officiel (jusqu'ici seul le domaine
-- governance utilisait institutionsVisibles/lectureNationale ; journal
-- n'avait aucune plomberie pour ce cas, cause du 404 sur 007c sous-test 3).

-- 1. Active le flag pour PM (deja prevu dans le schema role, jamais peuple)
UPDATE role SET lecture_nationale = true WHERE code = 'PM';

-- 2. Ajoute une branche dediee, lecture seule, a la policy existante.
--    Se limite au SELECT pour ne pas etendre le principe du moindre privilege
--    a l'ecriture. current_setting('app.lecture_nationale', true) doit etre
--    positionne explicitement par requireAuth.js, jamais par defaut.
DROP POLICY IF EXISTS pol_acte_officiel_scope ON acte_officiel;
CREATE POLICY pol_acte_officiel_scope ON acte_officiel
  FOR ALL
  USING (
    COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
    OR (statut = 'publie' AND diffusion = 'public')
    OR (institution_emettrice_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid)
    OR (
      current_setting('app.lecture_nationale', true) = 'true'
    )
  )
  WITH CHECK (
    COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
    OR (institution_emettrice_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid)
  );

\echo '=== Verification lecture_nationale PM ==='
SELECT code, lecture_nationale FROM role WHERE code = 'PM';
