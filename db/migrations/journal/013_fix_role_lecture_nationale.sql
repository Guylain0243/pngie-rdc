-- 013_fix_role_lecture_nationale.sql
-- Correctif : PM et PR (roles a portee nationale, scope_institution_id NULL
-- dans personne_role) doivent avoir role.lecture_nationale = true.
BEGIN;
UPDATE role SET lecture_nationale = true WHERE code IN ('PM', 'PR');
COMMIT;