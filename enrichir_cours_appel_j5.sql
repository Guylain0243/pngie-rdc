-- ============================================================================
-- PNGIE-RDC — Enrichissement des 27 Cours d'Appel (Tome J5)
-- Structure de base déjà créée plus tôt (PRESIDENCE, PARQUET_GEN, CH_CIVILE,
-- CH_PENALE, CH_SOCIALE, GREFFE, SG) avec un poste par unité. On ajoute
-- uniquement ce qui manque au modèle officiel : Conseillers dans chaque
-- chambre, Avocats Généraux au Parquet, Greffiers au Greffe.
-- Additif uniquement — aucune ligne existante modifiée.
-- Exécution : psql -f .\enrichir_cours_appel_j5.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

DO $$
DECLARE v_nb_unites int; v_nb_postes int;
BEGIN
    SELECT COUNT(DISTINCT u.unite_id), COUNT(DISTINCT p.poste_id) INTO v_nb_unites, v_nb_postes
    FROM unite_organisationnelle u
    JOIN institution i ON i.institution_id = u.institution_id
    LEFT JOIN poste p ON p.unite_id = u.unite_id
    WHERE i.code LIKE 'CA_%';
    RAISE NOTICE '27 Cours d''Appel : % unité(s), % poste(s) existant(s) AVANT complément (attendu 189 unités = 27x7, 189 postes = 27x7).', v_nb_unites, v_nb_postes;
END $$;

-- ----------------------------------------------------------------------------
-- 1. Conseillers dans chaque chambre (Civile, Pénale, Sociale)
-- ----------------------------------------------------------------------------
INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, 'CONS', 'Conseiller'
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
WHERE i.code LIKE 'CA_%' AND u.code IN ('CH_CIVILE', 'CH_PENALE', 'CH_SOCIALE')
ON CONFLICT (unite_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Avocats Généraux au Parquet Général
-- ----------------------------------------------------------------------------
INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, 'AG', 'Avocat Général'
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
WHERE i.code LIKE 'CA_%' AND u.code = 'PARQUET_GEN'
ON CONFLICT (unite_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Greffiers (personnel) au Greffe
-- ----------------------------------------------------------------------------
INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, 'GREF', 'Greffier'
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
WHERE i.code LIKE 'CA_%' AND u.code = 'GREFFE'
ON CONFLICT (unite_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Contrôle final
-- ----------------------------------------------------------------------------
SELECT i.code, COUNT(DISTINCT u.unite_id) AS nb_unites, COUNT(DISTINCT p.poste_id) AS nb_postes
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.code LIKE 'CA_%'
GROUP BY i.code
ORDER BY i.code;

-- Attendu par Cour d'Appel : 7 unités (inchangé) / 12 postes (7 existants + 5 nouveaux :
-- 3 Conseillers + 1 Avocat Général + 1 Greffier)
COMMIT;
\echo '=== 27 Cours d''Appel enrichies (Tome J5) — structure existante préservée intégralement ==='
