-- ============================================================================
-- PNGIE-RDC — Direction du Budget (Tome F6)
-- Même traitement que le Trésor (F5) : institution autonome rattachée au
-- Ministère des Finances, unité D_BUDGET de MIN_5 désactivée (préservée).
-- Exécution : psql -f .\populate_direction_budget.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_parent_id uuid; v_parent_code text; v_id uuid; v_nb int;
BEGIN
    SELECT institution_id, code INTO v_parent_id, v_parent_code
    FROM institution WHERE nom ILIKE '%financ%' AND nom NOT ILIKE '%inspection%' AND statut = 'ACTIF' LIMIT 1;

    IF v_parent_id IS NULL THEN
        RAISE NOTICE '⚠️ Ministère des Finances (actif) introuvable — création SANS rattachement parent.';
    ELSE
        RAISE NOTICE '✅ Ministère des Finances trouvé (code=%, id=%).', v_parent_code, v_parent_id;
    END IF;

    SELECT institution_id INTO v_id FROM institution WHERE nom ILIKE '%budget%';
    IF v_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_nb FROM unite_organisationnelle WHERE institution_id = v_id;
        RAISE NOTICE '✅ Direction du Budget déjà existante (id=%), % unité(s).', v_id, v_nb;
    ELSE
        RAISE NOTICE '❌ Aucune "Direction du Budget" trouvée, création avec code DIR_BUDGET.';
    END IF;
END $$;

INSERT INTO institution (code, nom, type_institution, institution_parent_id, niveau_hierarchique, statut)
SELECT 'DIR_BUDGET', 'Direction du Budget',
       'direction_generale',
       (SELECT institution_id FROM institution WHERE nom ILIKE '%financ%' AND nom NOT ILIKE '%inspection%' AND statut = 'ACTIF' LIMIT 1),
       1, 'ACTIF'
WHERE NOT EXISTS (SELECT 1 FROM institution WHERE nom ILIKE '%budget%')
ON CONFLICT (code) DO NOTHING;

CREATE TEMP TABLE t_budget (code_unite text, nom_unite text, type_unite text, code_poste text, intitule_poste text);
INSERT INTO t_budget VALUES
('CABINET',         'Cabinet du Directeur du Budget',        'CABINET',     'DB',   'Directeur du Budget'),
('SG',              'Secrétariat Général',                    'SECRETARIAT', 'SG',   'Secrétaire Général'),
('INSPECTION',      'Inspection',                              'INSPECTION',  'INSP', 'Inspecteur'),
('D_PREPARATION',   'Direction de la Préparation Budgétaire', 'DIRECTION',   'DIR1', 'Directeur de la Préparation Budgétaire'),
('D_PROGRAMMATION', 'Direction de la Programmation',          'DIRECTION',   'DIR2', 'Directeur de la Programmation'),
('D_CREDITS',       'Direction des Crédits',                  'DIRECTION',   'DIR3', 'Directeur des Crédits'),
('D_SUIVI',         'Direction du Suivi Budgétaire',          'DIRECTION',   'DIR4', 'Directeur du Suivi Budgétaire'),
('D_PERFORMANCE',   'Direction de la Performance',             'DIRECTION',   'DIR5', 'Directeur de la Performance'),
('D_ETUDES',        'Direction des Études',                   'DIRECTION',   'DIR6', 'Directeur des Études');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, t.code_unite, t.nom_unite, t.type_unite
FROM institution i CROSS JOIN t_budget t
WHERE i.nom ILIKE '%budget%'
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, t.code_poste, t.intitule_poste
FROM institution i CROSS JOIN t_budget t
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = t.code_unite
WHERE i.nom ILIKE '%budget%'
ON CONFLICT (unite_id, code) DO NOTHING;

-- Désactivation de l'unité redondante dans MIN_5 uniquement (statut = ACTIF pour
-- exclure explicitement l'orphelin MIN_FINANCES cette fois)
UPDATE unite_organisationnelle u
SET statut = 'INACTIF', updated_at = now()
FROM institution i
WHERE u.institution_id = i.institution_id
  AND i.nom ILIKE '%financ%' AND i.nom NOT ILIKE '%inspection%' AND i.statut = 'ACTIF'
  AND u.code = 'D_BUDGET';

-- Contrôle
SELECT i.code, i.nom, i.institution_parent_id, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.nom ILIKE '%budget%'
GROUP BY i.code, i.nom, i.institution_parent_id;

SELECT u.code, u.nom, u.statut
FROM unite_organisationnelle u
JOIN institution i ON i.institution_id = u.institution_id
WHERE i.nom ILIKE '%financ%' AND i.nom NOT ILIKE '%inspection%' AND i.statut = 'ACTIF' AND u.code = 'D_BUDGET';

-- Attendu : Direction du Budget = 9 unités / 9 postes (ou plus si préexistant)
--           D_BUDGET dans MIN_5 (actif) = statut INACTIF (1 ligne)
COMMIT;
\echo '=== Direction du Budget créée (Tome F6), unité D_BUDGET de MIN_5 désactivée ==='
