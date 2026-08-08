-- ============================================================================
-- PNGIE-RDC — Trésor et Comptabilité Publique (Tome F5)
-- Créé comme institution autonome rattachée au Ministère des Finances,
-- au même niveau que DGI/DGDA/DGRAD. Les unités D_TRESOR et D_COMPTA créées
-- directement dans MIN_5 par le Tome F1 sont désactivées (préservées, pas
-- supprimées) car elles sont maintenant représentées par cette institution.
-- Exécution : psql -f .\populate_tresor_comptabilite.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_parent_id uuid; v_parent_code text; v_id uuid; v_nb int;
BEGIN
    SELECT institution_id, code INTO v_parent_id, v_parent_code
    FROM institution WHERE nom ILIKE '%financ%' AND nom NOT ILIKE '%inspection%' LIMIT 1;

    IF v_parent_id IS NULL THEN
        RAISE NOTICE '⚠️ Ministère des Finances introuvable — création SANS rattachement parent.';
    ELSE
        RAISE NOTICE '✅ Ministère des Finances trouvé (code=%, id=%).', v_parent_code, v_parent_id;
    END IF;

    SELECT institution_id INTO v_id FROM institution WHERE nom ILIKE '%tr%sor%' AND nom ILIKE '%comptabilit%';
    IF v_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_nb FROM unite_organisationnelle WHERE institution_id = v_id;
        RAISE NOTICE '✅ Institution Trésor/Comptabilité déjà existante (id=%), % unité(s).', v_id, v_nb;
    ELSE
        RAISE NOTICE '❌ Aucune institution "Trésor et Comptabilité Publique" trouvée, création avec code TRESOR_COMPTA.';
    END IF;
END $$;

INSERT INTO institution (code, nom, type_institution, institution_parent_id, niveau_hierarchique, statut)
SELECT 'TRESOR_COMPTA', 'Trésor et Comptabilité Publique',
       'direction_generale',
       (SELECT institution_id FROM institution WHERE nom ILIKE '%financ%' AND nom NOT ILIKE '%inspection%' LIMIT 1),
       1, 'ACTIF'
WHERE NOT EXISTS (SELECT 1 FROM institution WHERE nom ILIKE '%tr%sor%' AND nom ILIKE '%comptabilit%')
ON CONFLICT (code) DO NOTHING;

CREATE TEMP TABLE t_tresor (code_unite text, nom_unite text, type_unite text, code_poste text, intitule_poste text);
INSERT INTO t_tresor VALUES
('CABINET',           'Cabinet du Directeur du Trésor',        'CABINET',     'DT',   'Directeur du Trésor'),
('SG',                'Secrétariat Général',                    'SECRETARIAT', 'SG',   'Secrétaire Général'),
('INSPECTION',        'Inspection Financière',                  'INSPECTION',  'IF',   'Inspecteur Financier'),
('D_TRESORERIE',      'Direction de la Trésorerie',             'DIRECTION',   'DIR1', 'Directeur de la Trésorerie'),
('D_COMPTA',          'Direction de la Comptabilité Publique',  'DIRECTION',   'DIR2', 'Directeur de la Comptabilité Publique'),
('D_PAIEMENTS',       'Direction des Paiements',                'DIRECTION',   'DIR3', 'Directeur des Paiements'),
('D_RECETTES',        'Direction des Recettes',                 'DIRECTION',   'DIR4', 'Directeur des Recettes'),
('D_RAPPROCHEMENTS',  'Direction des Rapprochements Bancaires', 'DIRECTION',   'DIR5', 'Directeur des Rapprochements Bancaires'),
('D_COMPTES_PUBLICS', 'Direction des Comptes Publics',          'DIRECTION',   'DIR6', 'Directeur des Comptes Publics');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, t.code_unite, t.nom_unite, t.type_unite
FROM institution i CROSS JOIN t_tresor t
WHERE i.nom ILIKE '%tr%sor%' AND i.nom ILIKE '%comptabilit%'
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, t.code_poste, t.intitule_poste
FROM institution i CROSS JOIN t_tresor t
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = t.code_unite
WHERE i.nom ILIKE '%tr%sor%' AND i.nom ILIKE '%comptabilit%'
ON CONFLICT (unite_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Désactivation des unités devenues redondantes dans MIN_5 (préservées, pas supprimées)
-- ----------------------------------------------------------------------------
UPDATE unite_organisationnelle u
SET statut = 'INACTIF', updated_at = now()
FROM institution i
WHERE u.institution_id = i.institution_id
  AND i.nom ILIKE '%financ%' AND i.nom NOT ILIKE '%inspection%'
  AND u.code IN ('D_TRESOR', 'D_COMPTA');

-- Contrôle
SELECT i.code, i.nom, i.institution_parent_id, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.nom ILIKE '%tr%sor%' AND i.nom ILIKE '%comptabilit%'
GROUP BY i.code, i.nom, i.institution_parent_id;

SELECT u.code, u.nom, u.statut
FROM unite_organisationnelle u
JOIN institution i ON i.institution_id = u.institution_id
WHERE i.nom ILIKE '%financ%' AND i.nom NOT ILIKE '%inspection%' AND u.code IN ('D_TRESOR','D_COMPTA');

-- Attendu : institution Trésor/Comptabilité = 9 unités / 9 postes (ou plus si préexistant)
--           D_TRESOR et D_COMPTA dans MIN_5 = statut INACTIF (2 lignes)
COMMIT;
\echo '=== Trésor et Comptabilité Publique créé (Tome F5), unités redondantes de MIN_5 désactivées ==='
