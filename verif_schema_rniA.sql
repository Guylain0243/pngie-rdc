\d person
\d personne
\d instruction_historique
SELECT
    tc.table_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('instruction','execution_rapport','verification','affectation','person_role')
ORDER BY tc.table_name, kcu.column_name;
SELECT COUNT(*) AS total_meta_permission FROM meta_permission;
SELECT COUNT(*) AS total_role_permission FROM role_permission;
