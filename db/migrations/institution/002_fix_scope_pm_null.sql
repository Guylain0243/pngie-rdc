-- ============================================================
-- 002_fix_scope_pm_null.sql
-- Correctif de donnees : personne_role.scope_institution_id de
-- test-pm@pngie.local etait NULL (jamais renseigne), desynchronise de son
-- affectation physique reelle (poste rattache a la Primature). Meme classe
-- de correctif que celui applique a MI dans le chantier RLS/ScopeResolver
-- precedent. Sans ce correctif, la policy institution_scope stricte
-- (001_consolidate_institution_scope.sql) fait que PM ne voit plus aucune
-- donnee (0 resultat au lieu d'un refus explicite), car app.current_institution_id
-- n'est jamais renseignee pour ce compte.
-- ============================================================

BEGIN;

UPDATE personne_role
SET scope_institution_id = 'ae011056-e941-4cb0-9504-9d1478324fc5' -- Primature
WHERE personne_id = (SELECT personne_id FROM personne WHERE email = 'test-pm@pngie.local');

COMMIT;

-- Verification manuelle recommandee apres application :
-- SELECT pr.scope_institution_id, i.nom
-- FROM personne p
-- JOIN personne_role pr ON pr.personne_id = p.personne_id
-- JOIN institution i ON i.institution_id = pr.scope_institution_id
-- WHERE p.email = 'test-pm@pngie.local';
-- -> doit renvoyer 'Primature'
