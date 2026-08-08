-- ============================================================================
-- PNGIE-RDC — Direction Générale des Impôts (DGI, Tome F2)
-- Rattachée institutionnellement au Ministère des Finances (institution_parent_id).
-- Directions Provinciales et Centres des Impôts non créés ici (générique,
-- pas de liste nominative fournie par le Tome).
-- Exécution : psql -f .\populate_dgi.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_parent_id uuid; v_id uuid; v_nb int;
BEGIN
    SELECT institution_id INTO v_parent_id
    FROM institution WHERE nom ILIKE '%minist%' AND nom ILIKE '%financ%' LIMIT 1;

    IF v_parent_id IS NULL THEN
        RAISE NOTICE '⚠️ Ministère des Finances introuvable — la DGI sera créée SANS rattachement parent. Exécutez d''abord populate_min_finances.sql.';
    ELSE
        RAISE NOTICE '✅ Ministère des Finances trouvé (institution_id=%), la DGI sera rattachée.', v_parent_id;
    END IF;

    SELECT institution_id INTO v_id FROM institution WHERE nom ILIKE '%imp_ts%' AND nom ILIKE '%g%n%rale%';
    IF v_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_nb FROM unite_organisationnelle WHERE institution_id = v_id;
        RAISE NOTICE '✅ DGI déjà existante (id=%), % unité(s) — seules les unités manquantes seront ajoutées.', v_id, v_nb;
    ELSE
        RAISE NOTICE '❌ Aucune DGI trouvée, création avec code temporaire DGI.';
    END IF;
END $$;

INSERT INTO institution (code, nom, type_institution, institution_parent_id, niveau_hierarchique, statut)
SELECT 'DGI', 'Direction Générale des Impôts',
       'direction_generale',
       (SELECT institution_id FROM institution WHERE nom ILIKE '%minist%' AND nom ILIKE '%financ%' LIMIT 1),
       1, 'ACTIF'
WHERE NOT EXISTS (SELECT 1 FROM institution WHERE nom ILIKE '%imp_ts%' AND nom ILIKE '%g%n%rale%')
ON CONFLICT (code) DO NOTHING;

CREATE TEMP TABLE t_dgi (code_unite text, nom_unite text, type_unite text, code_poste text, intitule_poste text);
INSERT INTO t_dgi VALUES
('CABINET',       'Cabinet du Directeur Général',            'CABINET',     'DG',   'Directeur Général'),
('DGA',           'Direction Générale Adjointe',              'DIRECTION',   'DGA',  'Directeur Général Adjoint'),
('INSPECTION',    'Inspection',                               'INSPECTION',  'INSP', 'Inspecteur'),
('SG',            'Secrétariat Général',                      'SECRETARIAT', 'SG',   'Secrétaire Général'),
('D_IMMAT',       'Direction des Immatriculations',           'DIRECTION',   'DIR1', 'Directeur des Immatriculations'),
('D_DECLAR',      'Direction des Déclarations',                'DIRECTION',   'DIR2', 'Directeur des Déclarations'),
('D_LIQUID',      'Direction des Liquidations',                'DIRECTION',   'DIR3', 'Directeur des Liquidations'),
('D_RECOUV',      'Direction du Recouvrement',                 'DIRECTION',   'DIR4', 'Directeur du Recouvrement'),
('D_CONTROLE',    'Direction du Contrôle Fiscal',              'DIRECTION',   'DIR5', 'Directeur du Contrôle Fiscal'),
('D_CONTENTIEUX', 'Direction du Contentieux',                  'DIRECTION',   'DIR6', 'Directeur du Contentieux'),
('D_ETUDES',      'Direction des Études et Statistiques',      'DIRECTION',   'DIR7', 'Directeur des Études et Statistiques');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, t.code_unite, t.nom_unite, t.type_unite
FROM institution i CROSS JOIN t_dgi t
WHERE i.nom ILIKE '%imp_ts%' AND i.nom ILIKE '%g%n%rale%'
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, t.code_poste, t.intitule_poste
FROM institution i CROSS JOIN t_dgi t
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = t.code_unite
WHERE i.nom ILIKE '%imp_ts%' AND i.nom ILIKE '%g%n%rale%'
ON CONFLICT (unite_id, code) DO NOTHING;

SELECT i.code, i.nom, i.institution_parent_id, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.nom ILIKE '%imp_ts%' AND i.nom ILIKE '%g%n%rale%'
GROUP BY i.code, i.nom, i.institution_parent_id;

-- Attendu : 11 unités / 11 postes, institution_parent_id renseigné (= Ministère des Finances)
COMMIT;
\echo '=== DGI peuplée (Tome F2) ==='
\echo 'RAPPEL : Directions Provinciales et Centres des Impôts non créés (génériques, pas de liste nominative fournie).'
