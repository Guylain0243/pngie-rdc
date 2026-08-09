-- ============================================================
-- 003_decision_workflow_transition.sql
-- Cockpit Gouvernemental V1 - Phase 3
-- Table pilotant les transitions d'etat autorisees pour decision_gouvernementale,
-- exact meme patron que acte_workflow_transition (Journal National), sans
-- dimension "type" (les decisions gouvernementales n'ont pas de typologie).
-- Regle validee (Q3) : aucun DELETE, transitions d'etat tracees uniquement.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS decision_workflow_transition (
  id SERIAL PRIMARY KEY,
  statut_origine VARCHAR NOT NULL,
  statut_cible VARCHAR NOT NULL,
  permission_requise VARCHAR NOT NULL,
  UNIQUE (statut_origine, statut_cible)
);

INSERT INTO decision_workflow_transition (statut_origine, statut_cible, permission_requise)
VALUES
  ('EN_COURS', 'PUBLIEE', 'governance.publier'),
  ('PUBLIEE', 'ARCHIVEE', 'governance.archiver'),
  ('EN_COURS', 'ANNULEE', 'governance.annuler')
ON CONFLICT (statut_origine, statut_cible) DO NOTHING;

-- Explicitement AUCUNE transition PUBLIEE -> ANNULEE (decide le 09/08/2026 :
-- une decision publiee officiellement ne peut plus etre annulee, seulement
-- archivee).

COMMIT;

-- Verification :
-- SELECT * FROM decision_workflow_transition ORDER BY id;
