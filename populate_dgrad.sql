-- ============================================================================
-- PNGIE-RDC — DGRAD (Direction Générale des Recettes Administratives,
-- Judiciaires, Domaniales et de Participations, Tome F4)
-- Rattachée au Ministère des Finances (MIN_5).
-- Directions Provinciales et Centres de perception non créés (génériques).
-- Exécution : psql -f .\populate_dgrad.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_parent_id uuid; v_parent_code text; v_id uuid; v_nb int;
BEGIN
    SELECT institution_id, code INTO v_parent_id, v_parent_code
    FROM institution WHERE nom ILIKE '%financ%' AND nom NOT ILIKE '%inspection%' LIMIT 1;

    IF v_parent_id IS NULL THEN
        RAISE NOTICE '⚠️ Ministère des Finances introuvable — la DGRAD sera créée SANS rattachement parent.';
    ELSE
        RAISE NOTICE '✅ Ministère des Finances trouvé (code=%, id=%), la DGRAD sera rattachée.', v_parent_code, v_parent_id;
    END IF;

    SELECT institution_id INTO v_id FROM institution
    WHERE nom ILIKE '%DGRAD%' OR (nom ILIKE '%recettes%' AND nom ILIKE '%domanial%');
    IF v_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_nb FROM unite_organisationnelle WHERE institution_id = v_id;
        RAISE NOTICE '✅ DGRAD déjà existante (id=%), % unité(s) — seules les unités manquantes seront ajoutées.', v_id, v_nb;
    ELSE
        RAISE NOTICE '❌ Aucune DGRAD trouvée, création avec code temporaire DGRAD.';
    END IF;
END $$;

INSERT INTO institution (code, nom, type_institution, institution_parent_id, niveau_hierarchique, statut)
SELECT 'DGRAD', 'Direction Générale des Recettes Administratives, Judiciaires, Domaniales et de Participations',
       'direction_generale',
       (SELECT institution_id FROM institution WHERE nom ILIKE '%financ%' AND nom NOT ILIKE '%inspection%' LIMIT 1),
       1, 'ACTIF'
WHERE NOT EXISTS (SELECT 1 FROM institution WHERE nom ILIKE '%DGRAD%' OR (nom ILIKE '%recettes%' AND nom ILIKE '%domanial%'))
ON CONFLICT (code) DO NOTHING;

CREATE TEMP TABLE t_dgrad (code_unite text, nom_unite text, type_unite text, code_poste text, intitule_poste text);
INSERT INTO t_dgrad VALUES
('CABINET',          'Cabinet du Directeur Général',           'CABINET',     'DG',   'Directeur Général'),
('DGA',              'Direction Générale Adjointe',             'DIRECTION',   'DGA',  'Directeur Général Adjoint'),
('INSPECTION',       'Inspection Générale',                     'INSPECTION',  'IG',   'Inspecteur Général'),
('SG',               'Secrétariat Général',                     'SECRETARIAT', 'SG',   'Secrétaire Général'),
('D_ADMIN',          'Direction des Recettes Administratives',  'DIRECTION',   'DIR1', 'Directeur des Recettes Administratives'),
('D_JUDICIAIRE',     'Direction des Recettes Judiciaires',      'DIRECTION',   'DIR2', 'Directeur des Recettes Judiciaires'),
('D_DOMANIAL',       'Direction des Recettes Domaniales',       'DIRECTION',   'DIR3', 'Directeur des Recettes Domaniales'),
('D_PARTICIPATIONS', 'Direction des Participations',            'DIRECTION',   'DIR4', 'Directeur des Participations'),
('D_RECOUVREMENT',   'Direction du Recouvrement',               'DIRECTION',   'DIR5', 'Directeur du Recouvrement'),
('D_CONTROLE',       'Direction du Contrôle',                   'DIRECTION',   'DIR6', 'Directeur du Contrôle'),
('D_CONTENTIEUX',    'Direction du Contentieux',                'DIRECTION',   'DIR7', 'Directeur du Contentieux'),
('D_ETUDES',         'Direction des Études et Statistiques',    'DIRECTION',   'DIR8', 'Directeur des Études et Statistiques');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, t.code_unite, t.nom_unite, t.type_unite
FROM institution i CROSS JOIN t_dgrad t
WHERE i.nom ILIKE '%DGRAD%' OR (i.nom ILIKE '%recettes%' AND i.nom ILIKE '%domanial%')
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, t.code_poste, t.intitule_poste
FROM institution i CROSS JOIN t_dgrad t
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = t.code_unite
WHERE i.nom ILIKE '%DGRAD%' OR (i.nom ILIKE '%recettes%' AND i.nom ILIKE '%domanial%')
ON CONFLICT (unite_id, code) DO NOTHING;

SELECT i.code, i.nom, i.institution_parent_id, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.nom ILIKE '%DGRAD%' OR (i.nom ILIKE '%recettes%' AND i.nom ILIKE '%domanial%')
GROUP BY i.code, i.nom, i.institution_parent_id;

-- Attendu : 12 unités / 12 postes (ou plus si contenu réel préexistant), institution_parent_id = Ministère des Finances
COMMIT;
\echo '=== DGRAD peuplée (Tome F4) ==='
\echo 'RAPPEL : Directions Provinciales et Centres de perception non créés (génériques, pas de liste nominative fournie).'
