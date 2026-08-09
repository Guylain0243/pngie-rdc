-- ============================================================
-- 002_decision_gouvernementale_colonnes_workflow.sql
-- Cockpit Gouvernemental V1 - Phase 3
-- Ajoute les colonnes de tracabilite manquantes sur decision_gouvernementale,
-- sur le meme modele que acte_officiel (cree_par, date_publication, etc.).
-- Additif uniquement, aucune donnee existante affectee (1 ligne en base
-- aujourd'hui, colonnes nullables).
-- ============================================================

BEGIN;

ALTER TABLE decision_gouvernementale
  ADD COLUMN IF NOT EXISTS cree_par UUID,
  ADD COLUMN IF NOT EXISTS date_publication TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS publie_par UUID,
  ADD COLUMN IF NOT EXISTS date_archivage TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archive_par UUID;

COMMIT;

-- Verification :
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'decision_gouvernementale' ORDER BY ordinal_position;
