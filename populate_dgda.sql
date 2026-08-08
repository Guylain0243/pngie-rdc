-- ============================================================================
-- PNGIE-RDC — Direction Générale des Douanes et Accises (DGDA, Tome F3)
-- Rattachée au Ministère des Finances (recherche par nom, filtre élargi
-- suite à la leçon du doublon MIN_FINANCES/MIN_5 : plus de %minist% obligatoire).
-- Directions Provinciales/Régionales et Bureaux Douaniers non créés (génériques).
-- Exécution : psql -f .\populate_dgda.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_parent_id uuid; v_parent_code text; v_id uuid; v_nb int; v_candidats int;
BEGIN
    SELECT COUNT(*) INTO v_candidats FROM institution WHERE nom ILIKE '%financ%';
    IF v_candidats > 1 THEN
        RAISE NOTICE '⚠️ % institutions contiennent "financ" dans leur nom — vérifiez qu''aucune n''est un faux positif (ex: Inspection Générale des Finances).', v_candidats;
    END IF;

    SELECT institution_id, code INTO v_parent_id, v_parent_code
    FROM institution WHERE nom ILIKE '%financ%' AND nom NOT ILIKE '%inspection%' LIMIT 1;

    IF v_parent_id IS NULL THEN
        RAISE NOTICE '⚠️ Ministère des Finances introuvable — la DGDA sera créée SANS rattachement parent.';
    ELSE
        RAISE NOTICE '✅ Ministère des Finances trouvé (code=%, id=%), la DGDA sera rattachée.', v_parent_code, v_parent_id;
    END IF;

    SELECT institution_id INTO v_id FROM institution WHERE nom ILIKE '%douan%';
    IF v_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_nb FROM unite_organisationnelle WHERE institution_id = v_id;
        RAISE NOTICE '✅ DGDA déjà existante (id=%), % unité(s) — seules les unités manquantes seront ajoutées.', v_id, v_nb;
    ELSE
        RAISE NOTICE '❌ Aucune DGDA trouvée, création avec code temporaire DGDA.';
    END IF;
END $$;

INSERT INTO institution (code, nom, type_institution, institution_parent_id, niveau_hierarchique, statut)
SELECT 'DGDA', 'Direction Générale des Douanes et Accises',
       'direction_generale',
       (SELECT institution_id FROM institution WHERE nom ILIKE '%financ%' AND nom NOT ILIKE '%inspection%' LIMIT 1),
       1, 'ACTIF'
WHERE NOT EXISTS (SELECT 1 FROM institution WHERE nom ILIKE '%douan%')
ON CONFLICT (code) DO NOTHING;

CREATE TEMP TABLE t_dgda (code_unite text, nom_unite text, type_unite text, code_poste text, intitule_poste text);
INSERT INTO t_dgda VALUES
('CABINET',         'Cabinet du Directeur Général',                              'CABINET',     'DG',   'Directeur Général'),
('DGA',             'Direction Générale Adjointe',                               'DIRECTION',   'DGA',  'Directeur Général Adjoint'),
('INSPECTION',      'Inspection Générale',                                       'INSPECTION',  'IG',   'Inspecteur Général'),
('SG',              'Secrétariat Général',                                       'SECRETARIAT', 'SG',   'Secrétaire Général'),
('D_IMPORT',        'Direction des Importations',                                'DIRECTION',   'DIR1', 'Directeur des Importations'),
('D_EXPORT',        'Direction des Exportations',                                'DIRECTION',   'DIR2', 'Directeur des Exportations'),
('D_ACCISES',       'Direction des Accises',                                     'DIRECTION',   'DIR3', 'Directeur des Accises'),
('D_CONTROLE',      'Direction du Contrôle Douanier',                            'DIRECTION',   'DIR4', 'Directeur du Contrôle Douanier'),
('D_RENSEIGNEMENT', 'Direction du Renseignement et de la Gestion des Risques',   'DIRECTION',   'DIR5', 'Directeur du Renseignement et de la Gestion des Risques'),
('D_CONTENTIEUX',   'Direction du Contentieux Douanier',                         'DIRECTION',   'DIR6', 'Directeur du Contentieux Douanier'),
('D_ETUDES',        'Direction des Études et Statistiques',                      'DIRECTION',   'DIR7', 'Directeur des Études et Statistiques');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, t.code_unite, t.nom_unite, t.type_unite
FROM institution i CROSS JOIN t_dgda t
WHERE i.nom ILIKE '%douan%'
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, t.code_poste, t.intitule_poste
FROM institution i CROSS JOIN t_dgda t
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = t.code_unite
WHERE i.nom ILIKE '%douan%'
ON CONFLICT (unite_id, code) DO NOTHING;

SELECT i.code, i.nom, i.institution_parent_id, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.nom ILIKE '%douan%'
GROUP BY i.code, i.nom, i.institution_parent_id;

-- Attendu : 11 unités / 11 postes (ou plus si contenu réel préexistant), institution_parent_id = Ministère des Finances
COMMIT;
\echo '=== DGDA peuplée (Tome F3) ==='
\echo 'RAPPEL : Directions Provinciales/Régionales et Bureaux Douaniers non créés (génériques, pas de liste nominative fournie).'
