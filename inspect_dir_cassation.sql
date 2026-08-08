-- ============================================================================
-- INSPECTION UNIQUEMENT — aucune modification. Vérifie si l'unité DIR
-- (Direction/Cabinet) de la Cour de Cassation porte des affectations réelles,
-- avant de décider si c'est un doublon à désactiver.
-- Exécution : psql -f .\inspect_dir_cassation.sql $env:PNGIE_DB_URL
-- ============================================================================

\echo '=== 1. Détail complet de l''unité DIR et de ses postes ==='
SELECT u.unite_id, u.code, u.nom, u.type_unite, u.statut, u.created_at,
       p.poste_id, p.code AS code_poste, p.intitule, p.statut AS statut_poste
FROM unite_organisationnelle u
JOIN institution i ON i.institution_id = u.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.nom ILIKE '%cassation%' AND u.code = 'DIR'
ORDER BY p.intitule;

\echo '=== 2. Affectations réelles (personnes) sur les postes de DIR ==='
SELECT p.code AS code_poste, p.intitule, COUNT(a.affectation_id) AS nb_affectations
FROM unite_organisationnelle u
JOIN institution i ON i.institution_id = u.institution_id
JOIN poste p ON p.unite_id = u.unite_id
LEFT JOIN affectation a ON a.poste_id = p.poste_id
WHERE i.nom ILIKE '%cassation%' AND u.code = 'DIR'
GROUP BY p.code, p.intitule;

\echo '=== 3. Comparaison : les mêmes rôles existent-ils ailleurs dans la Cour de Cassation ? ==='
SELECT u.code AS code_unite, u.nom AS nom_unite, p.code AS code_poste, p.intitule, 
       (SELECT COUNT(*) FROM affectation a WHERE a.poste_id = p.poste_id) AS nb_affectations
FROM unite_organisationnelle u
JOIN institution i ON i.institution_id = u.institution_id
JOIN poste p ON p.unite_id = u.unite_id
WHERE i.nom ILIKE '%cassation%'
  AND (p.intitule ILIKE '%président%cour%' OR p.intitule ILIKE '%greffier en chef%' 
       OR p.intitule ILIKE '%procureur général%' OR p.intitule ILIKE '%juge%' OR p.intitule ILIKE '%conseiller%')
ORDER BY p.intitule, u.code;

\echo '=== 4. Historique / création : quand DIR et ses postes ont-ils été créés ? ==='
SELECT u.code, u.created_at AS unite_created_at, p.code AS code_poste, p.created_at AS poste_created_at
FROM unite_organisationnelle u
JOIN institution i ON i.institution_id = u.institution_id
LEFT JOIN poste p ON p.unite_id = u.unite_id
WHERE i.nom ILIKE '%cassation%'
ORDER BY u.created_at, p.created_at;
