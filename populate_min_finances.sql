-- ============================================================================
-- PNGIE-RDC — Ministère des Finances (Tome F1)
-- DGI/DGDA/DGRAD explicitement reportées aux Tomes F2/F3/F4 — non créées ici.
-- Méthode : recherche par nom (filtre combiné pour ne pas confondre avec
-- l'Inspection Générale des Finances, déjà existante comme institution de
-- contrôle distincte), vérification de l'existant avant insertion.
-- Exécution : psql -f .\populate_min_finances.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_id int; v_code text; v_nom text; v_nb int; v_candidats int;
BEGIN
    SELECT COUNT(*) INTO v_candidats FROM institution WHERE nom ILIKE '%minist%' AND nom ILIKE '%financ%';
    IF v_candidats > 1 THEN
        RAISE NOTICE '⚠️ % candidats trouvés pour "Ministère des Finances" — vérifiez manuellement, le script prend le premier.', v_candidats;
    END IF;

    SELECT institution_id, code, nom INTO v_id, v_code, v_nom
    FROM institution WHERE nom ILIKE '%minist%' AND nom ILIKE '%financ%' LIMIT 1;

    IF v_id IS NULL THEN
        RAISE NOTICE '❌ Aucune institution "Ministère des Finances" trouvée. Création avec code temporaire MIN_FINANCES — à renommer selon la numérotation MIN_XX officielle si trouvée.';
    ELSE
        SELECT COUNT(*) INTO v_nb FROM unite_organisationnelle WHERE institution_id = v_id;
        RAISE NOTICE '✅ Institution trouvée : id=%, code=%, nom=%, unités existantes=%', v_id, v_code, v_nom, v_nb;
    END IF;
END $$;

INSERT INTO institution (code, nom, type_institution, statut)
SELECT 'MIN_FINANCES', 'Ministère des Finances', 'ministere', 'ACTIF'
WHERE NOT EXISTS (SELECT 1 FROM institution WHERE nom ILIKE '%minist%' AND nom ILIKE '%financ%')
ON CONFLICT (code) DO NOTHING;

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
WHERE i.nom ILIKE '%minist%' AND i.nom ILIKE '%financ%'
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, t.code_poste, t.intitule_poste
FROM institution i CROSS JOIN t_finances t
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = t.code_unite
WHERE i.nom ILIKE '%minist%' AND i.nom ILIKE '%financ%'
ON CONFLICT (unite_id, code) DO NOTHING;

SELECT i.code, i.nom, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.nom ILIKE '%minist%' AND i.nom ILIKE '%financ%'
GROUP BY i.code, i.nom;

-- Attendu : 9 unités / 9 postes (ou plus si contenu réel préexistant)
COMMIT;
\echo '=== Ministère des Finances peuplé (Tome F1) ==='
\echo 'RAPPEL : DGI, DGDA, DGRAD non créées ici — attendent les Tomes F2/F3/F4.'
