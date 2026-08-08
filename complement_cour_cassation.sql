-- ============================================================================
-- PNGIE-RDC — Cour de Cassation (Tome J3) — COMPLÉMENT UNIQUEMENT
-- Aucune ligne existante n'est modifiée. L'unité "DIR" (Direction / Cabinet)
-- et son poste au code anormal (UUID) ne sont PAS touchés ici — à traiter
-- séparément si besoin, signalé mais hors périmètre de ce complément.
-- Exécution : psql -f .\complement_cour_cassation.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

DO $$
DECLARE v_id uuid; v_nb_unites int; v_nb_postes int;
BEGIN
    SELECT institution_id INTO v_id FROM institution WHERE nom ILIKE '%cassation%';
    SELECT COUNT(DISTINCT u.unite_id), COUNT(DISTINCT p.poste_id) INTO v_nb_unites, v_nb_postes
    FROM unite_organisationnelle u LEFT JOIN poste p ON p.unite_id = u.unite_id
    WHERE u.institution_id = v_id;
    RAISE NOTICE 'Cour de Cassation (id=%) : % unité(s), % poste(s) existant(s) AVANT complément.', v_id, v_nb_unites, v_nb_postes;
    RAISE NOTICE '⚠️ Rappel : l''unité DIR (Direction/Cabinet) et son poste au code anormal ne sont pas traités ici.';
END $$;

-- ----------------------------------------------------------------------------
-- 1. Compléter le Parquet Général (PGEN-CASS) : Premiers Avocats Généraux, Avocats Généraux
-- ----------------------------------------------------------------------------
INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, x.code_poste, x.intitule_poste
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = 'PGEN-CASS'
CROSS JOIN (VALUES
    ('POS-CASS-PAG', 'Premier Avocat Général'),
    ('POS-CASS-AG',  'Avocat Général')
) AS x(code_poste, intitule_poste)
WHERE i.nom ILIKE '%cassation%'
ON CONFLICT (unite_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Compléter le Greffe (GREFFE-CASS) : Greffiers (personnel, distinct du Greffier en Chef)
-- ----------------------------------------------------------------------------
INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, 'POS-CASS-GREF', 'Greffier'
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = 'GREFFE-CASS'
WHERE i.nom ILIKE '%cassation%'
ON CONFLICT (unite_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Compléter les 3 Chambres (actuellement vides) : Président de Chambre + Conseillers
-- ----------------------------------------------------------------------------
INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, x.code_poste, x.intitule_poste
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = 'CH-CIV-CASS'
CROSS JOIN (VALUES
    ('POS-CASS-PCH-CIV',  'Président de la Chambre Civile'),
    ('POS-CASS-CONS-CIV', 'Conseiller à la Chambre Civile')
) AS x(code_poste, intitule_poste)
WHERE i.nom ILIKE '%cassation%'
ON CONFLICT (unite_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, x.code_poste, x.intitule_poste
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = 'CH-PEN-CASS'
CROSS JOIN (VALUES
    ('POS-CASS-PCH-PEN',  'Président de la Chambre Pénale'),
    ('POS-CASS-CONS-PEN', 'Conseiller à la Chambre Pénale')
) AS x(code_poste, intitule_poste)
WHERE i.nom ILIKE '%cassation%'
ON CONFLICT (unite_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, x.code_poste, x.intitule_poste
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = 'CH-SOC-CASS'
CROSS JOIN (VALUES
    ('POS-CASS-PCH-SOC',  'Président de la Chambre Sociale'),
    ('POS-CASS-CONS-SOC', 'Conseiller à la Chambre Sociale')
) AS x(code_poste, intitule_poste)
WHERE i.nom ILIKE '%cassation%'
ON CONFLICT (unite_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Contrôle final
-- ----------------------------------------------------------------------------
SELECT u.code AS code_unite, u.nom AS nom_unite, p.code AS code_poste,
       p.intitule AS intitule_poste, p.statut
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.nom ILIKE '%cassation%'
ORDER BY u.nom, p.intitule;

-- Attendu : les 13 lignes existantes inchangées + 8 nouvelles
-- (2 Parquet Général, 1 Greffe, 2x3 Chambres)
COMMIT;
\echo '=== Cour de Cassation complétée (Tome J3) — structure existante préservée intégralement ==='
\echo 'RAPPEL : unité DIR (Direction/Cabinet) et poste au code UUID anormal non traités — à examiner séparément.'
