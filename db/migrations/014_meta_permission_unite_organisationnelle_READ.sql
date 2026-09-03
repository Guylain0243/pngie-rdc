-- ============================================================
-- 014_meta_permission_unite_organisationnelle_READ.sql
-- Ajout de la permission READ sur 'unite_organisationnelle',
-- entite reellement verifiee par exigerPermission() dans
-- routes-generated/poste_hierarchie.routes.js (/postes/arborescence
-- et /postes/:id/environnement) -- confirme par lecture du code
-- source (src/security-engine.js + poste_hierarchie.routes.js).
-- La migration 013 (permission sur 'poste') etait une entite
-- incorrecte et reste sans effet sur cette route ; elle n'est
-- pas retiree car elle ne cause pas de tort et pourrait servir
-- ailleurs.
-- Matrice deduite de tests/e2e/004_postes.test.js :
--   MI, PM, PR, AN, GV, SN : READ (200) sur /api/postes/arborescence
-- ============================================================
BEGIN;

INSERT INTO permission (role_id, entite, action, statut)
SELECT r.role_id, 'unite_organisationnelle', 'READ', 'ACTIF'
FROM role r
WHERE r.code IN ('MI', 'PM', 'PR', 'AN', 'GV', 'SN')
  AND NOT EXISTS (
    SELECT 1 FROM permission p
    WHERE p.role_id = r.role_id AND p.entite = 'unite_organisationnelle' AND p.action = 'READ'
  );

COMMIT;