-- ============================================================
-- 004_permissions_governance.sql
-- Cockpit Gouvernemental V1 - Phase 3
-- Matrice RBAC complete pour decision_gouvernementale et decision_action,
-- dans la table `permission` (meme mecanisme que le Journal National :
-- personne_role.role_id -> permission.role_id / entite / action).
-- Remplace le mecanisme meta_permission pour ces deux tables (decision
-- migre vers le patron unique valide - cf. decision d'architecture du 09/08/2026).
--
-- Choix deliberé : deux entites separees ('decision_gouvernementale' et
-- 'decision_action') plutot qu'une entite unique 'governance' comme le fait
-- le Journal pour 'journal' -- parce que ces deux tables ont des matrices
-- d'acces differentes par role (AN/SN lisent les decisions mais n'ont AUCUN
-- acces a decision_action), contrairement au Journal ou une seule entite
-- suffit a representer le domaine.
-- ============================================================

BEGIN;

-- decision_gouvernementale ---------------------------------------------

INSERT INTO permission (role_id, entite, action, statut)
SELECT r.role_id, 'decision_gouvernementale', a.action, 'ACTIF'
FROM role r
CROSS JOIN (VALUES ('READ'), ('CREATE'), ('UPDATE'), ('publier'), ('archiver'), ('annuler')) AS a(action)
WHERE r.code = 'PR'
  AND NOT EXISTS (
    SELECT 1 FROM permission p WHERE p.role_id = r.role_id AND p.entite = 'decision_gouvernementale' AND p.action = a.action
  );

INSERT INTO permission (role_id, entite, action, statut)
SELECT r.role_id, 'decision_gouvernementale', a.action, 'ACTIF'
FROM role r
CROSS JOIN (VALUES ('READ'), ('CREATE'), ('UPDATE'), ('annuler')) AS a(action)
WHERE r.code IN ('PM', 'MI', 'GV')
  AND NOT EXISTS (
    SELECT 1 FROM permission p WHERE p.role_id = r.role_id AND p.entite = 'decision_gouvernementale' AND p.action = a.action
  );

-- AN/SN : READ seul. La restriction "decisions PUBLIEE uniquement" (Q1,
-- separation des pouvoirs) n'est PAS geree ici -- la table permission ne
-- fait qu'autoriser/refuser une action, pas filtrer par contenu. Ce filtre
-- doit etre applique explicitement dans decision.repository.js /
-- decision.service.js (WHERE statut = 'PUBLIEE' quand le role est AN/SN).
-- A implementer en Phase 6/7, pas oublier.
INSERT INTO permission (role_id, entite, action, statut)
SELECT r.role_id, 'decision_gouvernementale', 'READ', 'ACTIF'
FROM role r
WHERE r.code IN ('AN', 'SN')
  AND NOT EXISTS (
    SELECT 1 FROM permission p WHERE p.role_id = r.role_id AND p.entite = 'decision_gouvernementale' AND p.action = 'READ'
  );

-- Analyste Cockpit : READ seul, portee nationale via role.lecture_nationale
-- (scope-engine.js), pas via cette permission qui ne fait qu'autoriser l'action.
INSERT INTO permission (role_id, entite, action, statut)
SELECT r.role_id, 'decision_gouvernementale', 'READ', 'ACTIF'
FROM role r
WHERE r.code = 'ANALYSTE_COCKPIT'
  AND NOT EXISTS (
    SELECT 1 FROM permission p WHERE p.role_id = r.role_id AND p.entite = 'decision_gouvernementale' AND p.action = 'READ'
  );

-- decision_action ---------------------------------------------------------

-- PR : READ seul (vision nationale, ne saisit pas lui-meme l'avancement)
INSERT INTO permission (role_id, entite, action, statut)
SELECT r.role_id, 'decision_action', 'READ', 'ACTIF'
FROM role r
WHERE r.code = 'PR'
  AND NOT EXISTS (
    SELECT 1 FROM permission p WHERE p.role_id = r.role_id AND p.entite = 'decision_action' AND p.action = 'READ'
  );

-- PM/MI/GV : READ + UPDATE sur leur perimetre (deja existant pour MI via
-- l'ancien mecanisme meta_permission -- reproduit ici dans permission)
INSERT INTO permission (role_id, entite, action, statut)
SELECT r.role_id, 'decision_action', a.action, 'ACTIF'
FROM role r
CROSS JOIN (VALUES ('READ'), ('UPDATE')) AS a(action)
WHERE r.code IN ('PM', 'MI', 'GV')
  AND NOT EXISTS (
    SELECT 1 FROM permission p WHERE p.role_id = r.role_id AND p.entite = 'decision_action' AND p.action = a.action
  );

-- AN/SN : AUCUN acces a decision_action (Q1, donnee de gestion interne a
-- l'Executif) -- volontairement aucune ligne inseree.

-- Analyste Cockpit : READ seul, portee nationale
INSERT INTO permission (role_id, entite, action, statut)
SELECT r.role_id, 'decision_action', 'READ', 'ACTIF'
FROM role r
WHERE r.code = 'ANALYSTE_COCKPIT'
  AND NOT EXISTS (
    SELECT 1 FROM permission p WHERE p.role_id = r.role_id AND p.entite = 'decision_action' AND p.action = 'READ'
  );

COMMIT;

-- Verification :
-- SELECT r.code, p.entite, p.action FROM permission p JOIN role r ON r.role_id = p.role_id
-- WHERE p.entite IN ('decision_gouvernementale', 'decision_action') ORDER BY r.code, p.entite, p.action;
