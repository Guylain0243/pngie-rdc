-- ============================================================================
-- PNGIE-RDC — Conseil d'État (Tome J4) — COMPLÉMENT UNIQUEMENT
-- Aucune ligne existante n'est modifiée. Création du Parquet Général
-- (absent jusqu'ici) avec un Procureur Général distinct, décision utilisateur
-- confirmée. Ajout des Greffiers (personnel) dans le Greffe existant.
-- Exécution : psql -f .\complement_conseil_etat.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

DO $$
DECLARE v_id uuid; v_nb_unites int; v_nb_postes int;
BEGIN
    SELECT institution_id INTO v_id FROM institution WHERE nom ILIKE '%conseil d_%tat%';
    SELECT COUNT(DISTINCT u.unite_id), COUNT(DISTINCT p.poste_id) INTO v_nb_unites, v_nb_postes
    FROM unite_organisationnelle u LEFT JOIN poste p ON p.unite_id = u.unite_id
    WHERE u.institution_id = v_id;
    RAISE NOTICE 'Conseil d''État (id=%) : % unité(s), % poste(s) existant(s) AVANT complément.', v_id, v_nb_unites, v_nb_postes;
END $$;

-- ----------------------------------------------------------------------------
-- 1. Nouvelle unité : Parquet Général (absente jusqu'ici)
-- ----------------------------------------------------------------------------
INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, 'PARQUET-CE', 'Parquet Général près le Conseil d''État', 'PARQUET'
FROM institution i
WHERE i.nom ILIKE '%conseil d_%tat%'
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, x.code_poste, x.intitule_poste
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = 'PARQUET-CE'
CROSS JOIN (VALUES
    ('POS-CE-PROCUREUR', 'Procureur Général près le Conseil d''État'),
    ('POS-CE-PAG',        'Premier Avocat Général'),
    ('POS-CE-AG',         'Avocat Général')
) AS x(code_poste, intitule_poste)
WHERE i.nom ILIKE '%conseil d_%tat%'
ON CONFLICT (unite_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Compléter le Greffe (GREFFE-CE) : Greffiers (personnel, distinct du Greffier en Chef)
-- ----------------------------------------------------------------------------
INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, 'POS-CE-GREF', 'Greffier'
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = 'GREFFE-CE'
WHERE i.nom ILIKE '%conseil d_%tat%'
ON CONFLICT (unite_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Contrôle final
-- ----------------------------------------------------------------------------
SELECT u.code AS code_unite, u.nom AS nom_unite, p.code AS code_poste,
       p.intitule AS intitule_poste, p.statut
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.nom ILIKE '%conseil d_%tat%'
ORDER BY u.nom, p.intitule;

-- Attendu : les 7 lignes existantes inchangées + 4 nouvelles
-- (3 dans le nouveau Parquet Général, 1 Greffier supplémentaire)
COMMIT;
\echo '=== Conseil d''État complété (Tome J4) — Parquet Général créé, structure existante préservée ==='
