-- ============================================================================
-- PNGIE-RDC — Cour Constitutionnelle (Tome J2) — COMPLÉMENT UNIQUEMENT
-- Principe strict : aucune ligne existante n'est modifiée, renommée ou
-- déplacée. Le poste "Procureur Général" (POS-CC-PROCUREUR-NEW, dans l'unité
-- DA-CC) reste tel quel — sa légitimité relève de la Loi organique n°13/026
-- du 15/10/2013, pas de l'architecture technique. Seuls les éléments
-- officiels manquants (Parquet Général, Secrétariat du Parquet, Greffiers
-- Principaux/Divisionnaires, Conseillers Référendaires) sont ajoutés.
-- Exécution : psql -f .\complement_cour_constitutionnelle.sql $env:PNGIE_DB_URL
-- ============================================================================

BEGIN;

DO $$
DECLARE v_id uuid; v_nb_unites int; v_nb_postes int;
BEGIN
    SELECT institution_id INTO v_id FROM institution WHERE nom ILIKE '%constitutionnelle%';
    SELECT COUNT(DISTINCT u.unite_id), COUNT(DISTINCT p.poste_id) INTO v_nb_unites, v_nb_postes
    FROM unite_organisationnelle u LEFT JOIN poste p ON p.unite_id = u.unite_id
    WHERE u.institution_id = v_id;
    RAISE NOTICE 'Cour Constitutionnelle (id=%) : % unité(s), % poste(s) existant(s) AVANT complément — rien de tout cela ne sera modifié.', v_id, v_nb_unites, v_nb_postes;
    RAISE NOTICE 'Le poste "Procureur Général" (dans DA-CC) est conservé strictement tel quel, conformément à la Loi organique n°13/026.';
END $$;

-- ----------------------------------------------------------------------------
-- 1. Nouvelles unités officielles manquantes
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE t_cc_nouvelles_unites (code_unite text, nom_unite text, type_unite text);
INSERT INTO t_cc_nouvelles_unites VALUES
('PARQUET-CC', 'Parquet Général près la Cour Constitutionnelle', 'PARQUET'),
('SECPARQ-CC', 'Secrétariat du Parquet Général',                 'SECRETARIAT'),
('CONSREF-CC', 'Corps des Conseillers Référendaires',             'CORPS');

INSERT INTO unite_organisationnelle (institution_id, code, nom, type_unite)
SELECT i.institution_id, t.code_unite, t.nom_unite, t.type_unite
FROM institution i CROSS JOIN t_cc_nouvelles_unites t
WHERE i.nom ILIKE '%constitutionnelle%'
ON CONFLICT (institution_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Postes des nouvelles unités
-- ----------------------------------------------------------------------------
INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, x.code_poste, x.intitule_poste
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = 'PARQUET-CC'
CROSS JOIN (VALUES
    ('POS-CC-PAG', 'Premier Avocat Général'),
    ('POS-CC-AG',  'Avocat Général')
) AS x(code_poste, intitule_poste)
WHERE i.nom ILIKE '%constitutionnelle%'
ON CONFLICT (unite_id, code) DO NOTHING;

INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, 'POS-CC-SECPARQ', 'Premier Secrétaire du Parquet Général'
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = 'SECPARQ-CC'
WHERE i.nom ILIKE '%constitutionnelle%'
ON CONFLICT (unite_id, code) DO NOTHING;

-- Conseillers Référendaires : corps non encore installé selon le texte officiel
-- → statut VACANT, effectif autorisé plafonné à 60
INSERT INTO poste (unite_id, code, intitule, nombre_postes_autorises, statut)
SELECT u.unite_id, 'POS-CC-CONSREF', 'Conseiller Référendaire', 60, 'VACANT'
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = 'CONSREF-CC'
WHERE i.nom ILIKE '%constitutionnelle%'
ON CONFLICT (unite_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Ajout de postes manquants dans l'unité GREFFE-CC déjà existante
--    (le Greffier en Chef existant n'est pas touché, on ajoute seulement)
-- ----------------------------------------------------------------------------
INSERT INTO poste (unite_id, code, intitule)
SELECT u.unite_id, x.code_poste, x.intitule_poste
FROM institution i
JOIN unite_organisationnelle u ON u.institution_id = i.institution_id AND u.code = 'GREFFE-CC'
CROSS JOIN (VALUES
    ('POS-CC-GP', 'Greffier Principal'),
    ('POS-CC-GD', 'Greffier Divisionnaire')
) AS x(code_poste, intitule_poste)
WHERE i.nom ILIKE '%constitutionnelle%'
ON CONFLICT (unite_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Contrôle final — vue complète de la structure après complément
-- ----------------------------------------------------------------------------
SELECT u.code AS code_unite, u.nom AS nom_unite, p.code AS code_poste,
       p.intitule AS intitule_poste, p.nombre_postes_autorises, p.statut
FROM institution i
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.nom ILIKE '%constitutionnelle%'
ORDER BY u.nom, p.intitule;

-- Attendu : les 10 lignes existantes inchangées + les nouvelles :
-- PARQUET-CC (2 postes), SECPARQ-CC (1 poste), CONSREF-CC (1 poste, VACANT, x60),
-- GREFFE-CC enrichi de 2 postes supplémentaires
COMMIT;
\echo '=== Cour Constitutionnelle complétée (Tome J2) — structure officielle préservée intégralement ==='
