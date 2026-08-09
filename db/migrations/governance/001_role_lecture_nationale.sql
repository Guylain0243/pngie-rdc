-- ============================================================
-- 001_role_lecture_nationale.sql
-- Cockpit Gouvernemental V1 - Phase 3
-- Ajoute la capacite "lecture nationale" (role sans institution propre),
-- et cree le role Analyste Cockpit. Aucun impact sur les roles existants
-- (valeur par defaut false) ni sur les policies RLS (mecanisme gere
-- entierement par scope-engine.js, cf. COCKPIT_V1_PHASE2_ARCHITECTURE.md).
-- ============================================================

BEGIN;

ALTER TABLE role ADD COLUMN IF NOT EXISTS lecture_nationale BOOLEAN NOT NULL DEFAULT false;

INSERT INTO role (code, nom, categorie, description, statut, lecture_nationale)
SELECT 'ANALYSTE_COCKPIT', 'Analyste Cockpit', 'Fonction transverse',
       'Role fonctionnel sans institution propre. Vision nationale en lecture seule '
       || 'sur le Cockpit Gouvernemental (decisions, indicateurs, Journal National). '
       || 'Ne peut ni creer, ni modifier, ni publier, ni archiver, ni administrer.',
       'ACTIF', true
WHERE NOT EXISTS (SELECT 1 FROM role WHERE code = 'ANALYSTE_COCKPIT');

COMMIT;

-- Verification :
-- SELECT code, nom, categorie, lecture_nationale FROM role WHERE code = 'ANALYSTE_COCKPIT';
