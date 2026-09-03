-- 012_grant_pm_journal_creer.sql
-- Accorde la permission journal:creer au role PM (Personnel Municipal)
-- Corrige un correctif RBAC ad-hoc perdu lors d'un reseed de la base de test
-- (voir docs/sessions/SESSION_2026-08-30_JOURNAL_NATIONAL.md)

INSERT INTO permission (role_id, entite, action)
SELECT role_id, 'journal', 'creer'
FROM role
WHERE code = 'PM'
ON CONFLICT (role_id, entite, action) DO NOTHING;