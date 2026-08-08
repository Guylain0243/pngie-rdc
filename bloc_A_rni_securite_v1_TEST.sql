-- ============================================================================
-- PNGIE-RDC — RNI Sécurité v1 — BLOC A
-- Matrice de permissions conservatrice + table delegation_perimetre
-- A EXECUTER APRES RELECTURE. Transaction unique, ROLLBACK possible.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. MATRICE DE PERMISSIONS RNI — table réelle : permission (pas meta_permission,
--    qui est une VUE en lecture seule : SELECT p.*, r.code AS role_code
--    FROM permission p JOIN role r ON r.role_id = p.role_id).
--    Colonne réelle : "entite" (pas "entity", qui n'existe que dans la vue).
--    Conservatrice et réversible : deny-by-default implicite (absence de ligne
--    = refus, appliqué au niveau applicatif dans exigerPermissionRni()).
--
--    rni_lien.CREATE / UPDATE / DEACTIVATE : ACCORDES A PERSONNE pour l'instant.
--    rni_instruction.UPDATE_STATUS : ACCORDE A PERSONNE pour l'instant.
--    (machine à états à définir avant d'ouvrir ces droits)
-- ----------------------------------------------------------------------------

INSERT INTO permission (permission_id, role_id, entite, action, statut)
SELECT gen_random_uuid(), r.role_id, v.entite, v.action, 'ACTIF'
FROM (VALUES
    ('PR', 'rni_lien', 'READ'),
    ('PM', 'rni_lien', 'READ'),
    ('MI', 'rni_lien', 'READ'),
    ('GV', 'rni_lien', 'READ'),
    ('AN', 'rni_lien', 'READ'),
    ('SN', 'rni_lien', 'READ'),

    ('PR', 'rni_instruction', 'READ'),
    ('PR', 'rni_instruction', 'CREATE'),
    ('PM', 'rni_instruction', 'READ'),
    ('PM', 'rni_instruction', 'CREATE'),
    ('MI', 'rni_instruction', 'READ'),
    ('MI', 'rni_instruction', 'CREATE'),
    ('GV', 'rni_instruction', 'READ'),
    ('GV', 'rni_instruction', 'CREATE'),
    ('AN', 'rni_instruction', 'READ'),
    ('SN', 'rni_instruction', 'READ'),

    ('PR', 'rni_rapport', 'READ'),
    ('PM', 'rni_rapport', 'READ'),
    ('PM', 'rni_rapport', 'VERIFY'),
    ('MI', 'rni_rapport', 'READ'),
    ('MI', 'rni_rapport', 'CREATE'),
    ('MI', 'rni_rapport', 'VERIFY'),
    ('GV', 'rni_rapport', 'READ'),
    ('GV', 'rni_rapport', 'CREATE'),
    ('GV', 'rni_rapport', 'VERIFY'),
    ('AN', 'rni_rapport', 'READ'),
    ('SN', 'rni_rapport', 'READ')
) AS v(role_code, entite, action)
JOIN role r ON r.code = v.role_code;

-- ----------------------------------------------------------------------------
-- 2. TABLE delegation_perimetre
--    Enfant normalisée de delegation_pouvoir. delegation_pouvoir.perimetre
--    (texte libre) reste en place comme champ descriptif/historique — il
--    n'est JAMAIS parsé par le code applicatif pour décider d'une autorisation.
-- ----------------------------------------------------------------------------

CREATE TABLE delegation_perimetre (
    delegation_perimetre_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    delegation_id            uuid NOT NULL REFERENCES delegation_pouvoir(delegation_id),
    institution_id            uuid NOT NULL REFERENCES institution(institution_id),
    entity                    character varying(100) NOT NULL,
    action                    character varying(30) NOT NULL,
    actif                     boolean NOT NULL DEFAULT true,
    created_at                timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_delegation_perimetre_delegation ON delegation_perimetre(delegation_id);
CREATE INDEX idx_delegation_perimetre_institution ON delegation_perimetre(institution_id);

CREATE UNIQUE INDEX uq_delegation_perimetre_actif
    ON delegation_perimetre(delegation_id, institution_id, entity, action)
    WHERE actif = true;

ROLLBACK;

-- ============================================================================
-- Vérifications post-exécution (lecture seule, à lancer après le COMMIT)
-- ============================================================================
-- SELECT role_code, entity, action FROM meta_permission
--   WHERE entity IN ('rni_lien','rni_instruction','rni_rapport')
--   ORDER BY entity, role_code, action;
-- \d delegation_perimetre