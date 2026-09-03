-- ============================================================
-- 013_meta_permission_poste_READ.sql
-- Ajout de la permission READ manquante sur l'entite 'poste'.
-- meta_permission renvoyait 0 ligne pour 'poste' (verifie le 30/08/2026),
-- provoquant un 403 systematique sur /api/postes/arborescence et
-- /api/postes/:id/environnement pour tous les roles.
-- Matrice deduite strictement de tests/e2e/004_postes.test.js :
--   MI, PM, PR, AN, GV, SN : READ (200) sur /api/postes/arborescence
--   Le controle de perimetre (403 hors zone) est gere par le scope,
--   pas par cette permission -- aucune action CREATE/UPDATE/DELETE
--   n'est couverte par ce test, donc aucune n'est ajoutee ici.
-- ============================================================
BEGIN;

INSERT INTO permission (role_id, entite, action, statut)
SELECT r.role_id, 'poste', 'READ', 'ACTIF'
FROM role r
WHERE r.code IN ('MI', 'PM', 'PR', 'AN', 'GV', 'SN')
  AND NOT EXISTS (
    SELECT 1 FROM permission p
    WHERE p.role_id = r.role_id AND p.entite = 'poste' AND p.action = 'READ'
  );

COMMIT;