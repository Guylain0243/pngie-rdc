-- ============================================================================
-- PNGIE-RDC — AUDIT GLOBAL (lecture seule, aucune modification)
-- Photographie complète de l'état du serveur pour reprise de session.
-- Exécution : psql -f .\audit_global_pngie.sql $env:PNGIE_DB_URL
-- (certaines sections peuvent nécessiter PNGIE_ADMIN_DB_URL selon les droits
-- de lecture sur pg_catalog / information_schema — à essayer avec PNGIE_DB_URL
-- d'abord, basculer sur ADMIN seulement si des lignes manquent)
-- ============================================================================

\echo '========================================================================'
\echo '1. INVENTAIRE COMPLET DES TABLES DU SCHEMA PUBLIC'
\echo '========================================================================'
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS nb_colonnes
FROM information_schema.tables t
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

\echo ''
\echo '========================================================================'
\echo '2. VOLUMETRIE PAR TABLE (nombre de lignes)'
\echo '========================================================================'
SELECT
    schemaname,
    relname AS table_name,
    n_live_tup AS nb_lignes_estimees
FROM pg_stat_user_tables
ORDER BY relname;

\echo ''
\echo '========================================================================'
\echo '3. INSTITUTIONS — repartition par type et statut'
\echo '========================================================================'
SELECT type_institution, statut, COUNT(*) AS nb
FROM institution
GROUP BY type_institution, statut
ORDER BY type_institution, statut;

\echo ''
\echo '========================================================================'
\echo '4. INSTITUTIONS — liste complete avec unites/postes et parent'
\echo '========================================================================'
SELECT
    i.code,
    i.nom,
    i.type_institution,
    i.statut,
    p.code AS code_parent,
    COUNT(DISTINCT u.unite_id) AS nb_unites,
    COUNT(DISTINCT po.poste_id) AS nb_postes
FROM institution i
LEFT JOIN institution p ON p.institution_id = i.institution_parent_id
LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
LEFT JOIN poste po ON po.unite_id = u.unite_id
GROUP BY i.code, i.nom, i.type_institution, i.statut, p.code
ORDER BY i.type_institution, i.code;

\echo ''
\echo '========================================================================'
\echo '5. DETECTION DE DOUBLONS POTENTIELS (noms tres proches)'
\echo '========================================================================'
SELECT nom, COUNT(*) AS occurrences, array_agg(code) AS codes, array_agg(statut) AS statuts
FROM institution
GROUP BY nom
HAVING COUNT(*) > 1;

\echo ''
\echo '========================================================================'
\echo '6. UNITES SANS AUCUN POSTE (potentiellement incompletes)'
\echo '========================================================================'
SELECT i.code AS institution, u.code AS unite, u.nom AS nom_unite
FROM unite_organisationnelle u
JOIN institution i ON i.institution_id = u.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE p.poste_id IS NULL
ORDER BY i.code, u.code;

\echo ''
\echo '========================================================================'
\echo '7. POSTES AVEC AFFECTATIONS REELLES (personnes effectivement nommees)'
\echo '========================================================================'
SELECT i.code AS institution, u.code AS unite, p.code AS poste, p.intitule, COUNT(a.affectation_id) AS nb_affectations
FROM poste p
JOIN unite_organisationnelle u ON u.unite_id = p.unite_id
JOIN institution i ON i.institution_id = u.institution_id
LEFT JOIN affectation a ON a.poste_id = p.poste_id
GROUP BY i.code, u.code, p.code, p.intitule
HAVING COUNT(a.affectation_id) > 0
ORDER BY i.code, u.code;

\echo ''
\echo '========================================================================'
\echo '8. REFERENTIELS NATIONAUX (ref_*) — inventaire et volumetrie'
\echo '========================================================================'
SELECT
    'ref_juridiction_militaire' AS referentiel, type_juridiction AS categorie, statut, COUNT(*) AS nb
FROM ref_juridiction_militaire GROUP BY type_juridiction, statut
UNION ALL
SELECT 'ref_auditorat_militaire', type_auditorat, statut, COUNT(*)
FROM ref_auditorat_militaire GROUP BY type_auditorat, statut
UNION ALL
SELECT 'ref_tribunal_grande_instance', 'TGI', statut, COUNT(*)
FROM ref_tribunal_grande_instance GROUP BY statut
UNION ALL
SELECT 'ref_tribunal_paix', 'TP', statut, COUNT(*)
FROM ref_tribunal_paix GROUP BY statut
UNION ALL
SELECT 'ref_tribunal_commerce', 'TCOM', statut, COUNT(*)
FROM ref_tribunal_commerce GROUP BY statut
UNION ALL
SELECT 'ref_tribunal_travail', 'TTRAV', statut, COUNT(*)
FROM ref_tribunal_travail GROUP BY statut
UNION ALL
SELECT 'ref_tribunal_enfants', 'TENF', statut, COUNT(*)
FROM ref_tribunal_enfants GROUP BY statut
UNION ALL
SELECT 'ref_parquet', type_parquet, statut, COUNT(*)
FROM ref_parquet GROUP BY type_parquet, statut
UNION ALL
SELECT 'ref_greffe', 'GREFFE', statut, COUNT(*)
FROM ref_greffe GROUP BY statut
UNION ALL
SELECT 'ref_casier_judiciaire', 'CASIER', statut, COUNT(*)
FROM ref_casier_judiciaire GROUP BY statut
UNION ALL
SELECT 'ref_execution_decision', 'EXECUTION', etat_execution, COUNT(*)
FROM ref_execution_decision GROUP BY etat_execution
ORDER BY referentiel, categorie, statut;

\echo ''
\echo '========================================================================'
\echo '9. RNSO / MNGI — modeles disponibles et fonctions installees'
\echo '========================================================================'
SELECT m.code, m.nom, m.domaine, m.statut,
       COUNT(DISTINCT mu.id) AS nb_unites_modele,
       COUNT(DISTINCT mp.id) AS nb_postes_modele
FROM rnso_modele m
LEFT JOIN rnso_modele_unite mu ON mu.modele_id = m.modele_id
LEFT JOIN rnso_modele_poste mp ON mp.modele_unite_id = mu.id
GROUP BY m.code, m.nom, m.domaine, m.statut
ORDER BY m.code;

\echo ''
\echo '--- Fonctions PL/pgSQL installees (MNGI et autres) ---'
SELECT proname AS fonction, pg_get_function_identity_arguments(oid) AS arguments
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;

\echo ''
\echo '--- Triggers installes ---'
SELECT event_object_table AS table_name, trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

\echo ''
\echo '========================================================================'
\echo '10. RNSO v2 GENERIQUE — etat (schema parallele, doit etre vide)'
\echo '========================================================================'
SELECT 'rnso_type_structure' AS table_name, COUNT(*) AS nb FROM rnso_type_structure
UNION ALL SELECT 'rnso_type_poste', COUNT(*) FROM rnso_type_poste
UNION ALL SELECT 'rnso_structure', COUNT(*) FROM rnso_structure
UNION ALL SELECT 'rnso_poste', COUNT(*) FROM rnso_poste
UNION ALL SELECT 'rnso_affectation', COUNT(*) FROM rnso_affectation
UNION ALL SELECT 'rnso_regle', COUNT(*) FROM rnso_regle
UNION ALL SELECT 'rnso_fonction', COUNT(*) FROM rnso_fonction
UNION ALL SELECT 'rnso_historique', COUNT(*) FROM rnso_historique;

\echo ''
\echo '========================================================================'
\echo '11. CODES DE POSTES CONTENANT ENCORE LE SUFFIXE -NEW (nettoyage cosmetique connu)'
\echo '========================================================================'
SELECT i.code AS institution, u.code AS unite, p.code AS poste, p.intitule
FROM poste p
JOIN unite_organisationnelle u ON u.unite_id = p.unite_id
JOIN institution i ON i.institution_id = u.institution_id
WHERE p.code LIKE '%-NEW'
ORDER BY i.code;

\echo ''
\echo '========================================================================'
\echo '12. TAILLE TOTALE DE LA BASE'
\echo '========================================================================'
SELECT pg_size_pretty(pg_database_size(current_database())) AS taille_base;

\echo ''
\echo '=== AUDIT TERMINE ==='
