-- ============================================================================
-- CORRECTIF : doublon Ministère des Finances
-- MIN_5 "Finances" est le vrai Ministère (déjà lié à la DGI).
-- MIN_FINANCES a été créé par erreur (filtre %minist% n'a pas matché "Finances").
-- On ajoute les 9 unités du modèle F1 à MIN_5 (si absentes), puis on désactive
-- MIN_FINANCES sans rien supprimer.
-- Exécution : psql -f .\fix_doublon_min_finances.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

DO $$
DECLARE v_nb int;
BEGIN
    SELECT COUNT(*) INTO v_nb FROM unite_organisationnelle u
    JOIN institution i ON i.institution_id = u.institution_id
    WHERE i.code = 'MIN_5';
    RAISE NOTICE 'MIN_5 (Finances) a % unité(s) existante(s) avant correctif.', v_nb;
END $$;

CREATE TEMP TABLE t_finances (code_unite text, nom_unite text, type_unite text, code_poste text, intitule_poste text);
INSERT INTO t_finances VALUES
('CABINET',    'Cabinet du Ministre',                    'CABINET',     'MIN', 'Ministre'),
('SG',         'Secrétariat Général',                    'SECRETARIAT', 'SG',  'Secrétaire Général'),
('IG',         'Inspection Générale',                    'INSPECTION',  'IG',  'Inspecteur Général'),
('D_BUDGET',   'Direction du Budget',                    'DIRECTION',   'DB',  'Directeur du Budget'),
('D_TRESOR',   'Direction du Trésor',                    'DIRECTION',   'DT',  'Directeur du Trésor'),
('D_COMPTA',   'Direction de la Comptabilité Publique',  'DIRECTION',   'DCP', 'Directeur de la Comptabilité Publique'),
('D_DETTE',    'Direction de la Dette Publique',         'DIRECTION',   'DDP', 'Directeur de la Dette Publique'),
('D_ETUDES',   'Direction des Études et Prévisions',     'DIRECTION',   'DEP', 'Directeur des Études et Prévisions'),
('CELL_PNGIE', 'Cellule PNGIE',                          'CELLULE',     'CP',  'Chef de la Cellule PNGIE');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, t.code_unite, t.nom_unite, t.type_unite
FROM institution i CROSS JOIN t_finances t
WHERE i.code = 'MIN_5'
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, t.code_poste, t.intitule_poste
FROM institution i CROSS JOIN t_finances t
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = t.code_unite
WHERE i.code = 'MIN_5'
ON CONFLICT (unite_id, code) DO NOTHING;

-- Désactivation du doublon (préservé, pas supprimé)
UPDATE institution SET statut = 'INACTIF', updated_at = now() WHERE code = 'MIN_FINANCES';

-- Contrôle
SELECT code, nom, statut FROM institution WHERE code IN ('MIN_5','MIN_FINANCES');

SELECT i.code, i.nom, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.code = 'MIN_5'
GROUP BY i.code, i.nom;

COMMIT;
\echo '=== Doublon Ministère des Finances corrigé : MIN_5 actif et complété, MIN_FINANCES désactivé ==='
