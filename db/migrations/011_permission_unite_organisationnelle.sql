-- Migration : ajout de la permission unite_organisationnelle/READ, manquante pour tous les roles.
-- Cause : les routes /postes/arborescence et /postes/:id/environnement exigent
-- exigerPermission("unite_organisationnelle", "READ"), mais aucune ligne n existait
-- dans permission pour cette entite. Matrice deduite de tests/e2e/004_postes.test.js :
-- tous les roles actifs (AN, MI, PM, PR, GV, SN) ont READ sur unite_organisationnelle.
-- Le controle de perimetre fin (qui voit quel poste precisement) reste gere par
-- exigerPortee, en aval de cette verification de permission.
INSERT INTO permission (role_id, entite, action, statut)
SELECT role_id, 'unite_organisationnelle', 'READ', 'ACTIF'
FROM role
WHERE code IN ('AN','MI','PM','PR','GV','SN')
  AND NOT EXISTS (
    SELECT 1 FROM permission p
    WHERE p.role_id = role.role_id AND p.entite = 'unite_organisationnelle' AND p.action = 'READ'
  );
