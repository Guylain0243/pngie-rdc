-- ============================================================
-- 008_meta_permission_agent_rh_FIX.sql
-- Corrige 008_meta_permission_agent_rh.sql : les role_id etaient
-- codes en dur et ne correspondaient a aucun role de cette base.
-- Resolution dynamique par role.code, matrice issue de
-- tests/e2e/002_rbac.test.js (MI/PM/PR lecture, MI/PR ecriture,
-- PM lecture seule, AN/GV/SN aucun acces).
-- ============================================================
BEGIN;

-- agent : READ pour MI, PM, PR
INSERT INTO permission (role_id, entite, action, statut)
SELECT r.role_id, 'agent', a.action, 'ACTIF'
FROM role r
CROSS JOIN (VALUES ('READ')) AS a(action)
WHERE r.code IN ('MI', 'PM', 'PR')
  AND NOT EXISTS (
    SELECT 1 FROM permission p WHERE p.role_id = r.role_id AND p.entite = 'agent' AND p.action = a.action
  );

-- agent : CREATE/UPDATE/DELETE pour MI, PR uniquement (PM = lecture seule)
INSERT INTO permission (role_id, entite, action, statut)
SELECT r.role_id, 'agent', a.action, 'ACTIF'
FROM role r
CROSS JOIN (VALUES ('CREATE'), ('UPDATE'), ('DELETE')) AS a(action)
WHERE r.code IN ('MI', 'PR')
  AND NOT EXISTS (
    SELECT 1 FROM permission p WHERE p.role_id = r.role_id AND p.entite = 'agent' AND p.action = a.action
  );

-- affectation : READ pour MI, PM, PR
INSERT INTO permission (role_id, entite, action, statut)
SELECT r.role_id, 'affectation', a.action, 'ACTIF'
FROM role r
CROSS JOIN (VALUES ('READ')) AS a(action)
WHERE r.code IN ('MI', 'PM', 'PR')
  AND NOT EXISTS (
    SELECT 1 FROM permission p WHERE p.role_id = r.role_id AND p.entite = 'affectation' AND p.action = a.action
  );

-- affectation : CREATE/UPDATE/DELETE pour MI, PR uniquement
INSERT INTO permission (role_id, entite, action, statut)
SELECT r.role_id, 'affectation', a.action, 'ACTIF'
FROM role r
CROSS JOIN (VALUES ('CREATE'), ('UPDATE'), ('DELETE')) AS a(action)
WHERE r.code IN ('MI', 'PR')
  AND NOT EXISTS (
    SELECT 1 FROM permission p WHERE p.role_id = r.role_id AND p.entite = 'affectation' AND p.action = a.action
  );

COMMIT;