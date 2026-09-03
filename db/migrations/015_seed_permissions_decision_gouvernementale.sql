-- 015_seed_permissions_decision_gouvernementale.sql
-- Le Cockpit et le module Decisions verifient permission (entite=decision_gouvernementale)
-- via decision.repository.js/possedePermission et decision.service.js/verifierPermission.
-- Aucune ligne n'existait encore pour cette entite dans la table permission.
BEGIN;

INSERT INTO permission (role_id, entite, action, statut)
SELECT role_id, 'decision_gouvernementale', a, 'actif'
FROM role, (VALUES ('READ')) AS v(a)
WHERE code IN ('MI', 'PM', 'PR', 'AN', 'SN', 'GV')
ON CONFLICT (role_id, entite, action) DO NOTHING;

INSERT INTO permission (role_id, entite, action, statut)
SELECT role_id, 'decision_gouvernementale', a, 'actif'
FROM role, (VALUES ('CREATE'), ('UPDATE')) AS v(a)
WHERE code = 'MI'
ON CONFLICT (role_id, entite, action) DO NOTHING;

COMMIT;