-- ============================================================
-- 002_seed_type_acte.sql
-- Référentiel des types d'actes + transitions de workflow par défaut
-- ============================================================

BEGIN;

INSERT INTO type_acte_ref (code, libelle, ordre_affichage) VALUES
 ('LOI', 'Loi', 10),
 ('ORDONNANCE', 'Ordonnance', 20),
 ('DECRET', 'Décret', 30),
 ('ARRETE', 'Arrêté', 40),
 ('INSTRUCTION', 'Instruction', 50),
 ('DIRECTIVE', 'Directive', 60),
 ('NOTE_SERVICE', 'Note de service', 70),
 ('DECISION_JUDICIAIRE', 'Décision judiciaire publiée', 80),
 ('TRAITE_ACCORD', 'Traité / Accord international', 90),
 ('COMMUNIQUE', 'Communiqué', 100),
 ('RECTIFICATIF', 'Rectificatif', 110),
 ('ABROGATION', 'Abrogation', 120);

-- ------------------------------------------------------------
-- Transitions par défaut — circuit complet (LOI, DECRET, ORDONNANCE,
-- ARRETE, TRAITE_ACCORD, DECISION_JUDICIAIRE, RECTIFICATIF, ABROGATION)
-- brouillon -> soumis -> en_validation -> valide -> signe -> publie -> archive
-- avec sortie rejete depuis soumis/en_validation
-- ------------------------------------------------------------
INSERT INTO acte_workflow_transition (type_acte_id, statut_origine, statut_cible, permission_requise)
SELECT t.id, v.statut_origine, v.statut_cible, v.permission_requise
FROM type_acte_ref t
CROSS JOIN (VALUES
    ('brouillon',     'soumis',        'journal.modifier'),
    ('soumis',        'en_validation', 'journal.valider'),
    ('soumis',        'rejete',        'journal.valider'),
    ('en_validation',  'valide',       'journal.valider'),
    ('en_validation',  'rejete',       'journal.valider'),
    ('valide',        'signe',         'journal.signer'),
    ('signe',         'publie',        'journal.publier'),
    ('publie',        'archive',       'journal.archiver')
) AS v(statut_origine, statut_cible, permission_requise)
WHERE t.code IN ('LOI','DECRET','ORDONNANCE','ARRETE','TRAITE_ACCORD',
                  'DECISION_JUDICIAIRE','RECTIFICATIF','ABROGATION');

-- ------------------------------------------------------------
-- Transitions allégées — INSTRUCTION, DIRECTIVE, NOTE_SERVICE, COMMUNIQUE
-- circuit court : pas de en_validation séparée
-- brouillon -> soumis -> valide -> signe -> publie -> archive
-- ------------------------------------------------------------
INSERT INTO acte_workflow_transition (type_acte_id, statut_origine, statut_cible, permission_requise)
SELECT t.id, v.statut_origine, v.statut_cible, v.permission_requise
FROM type_acte_ref t
CROSS JOIN (VALUES
    ('brouillon', 'soumis',  'journal.modifier'),
    ('soumis',    'valide',  'journal.valider'),
    ('soumis',    'rejete',  'journal.valider'),
    ('valide',    'signe',   'journal.signer'),
    ('signe',     'publie',  'journal.publier'),
    ('publie',    'archive', 'journal.archiver')
) AS v(statut_origine, statut_cible, permission_requise)
WHERE t.code IN ('INSTRUCTION','DIRECTIVE','NOTE_SERVICE','COMMUNIQUE');

-- NOTE : ce jeu de transitions est une proposition de départ.
-- Point ouvert #4 du document de conception : à valider avec le métier
-- avant mise en production (qui peut sauter en_validation, etc.).

COMMIT;
