SELECT pg_get_viewdef('public.person'::regclass, true) AS definition_vue_person;

SELECT
    tc.table_schema, tc.table_name, kcu.column_name,
    ccu.table_schema AS schema_cible, ccu.table_name AS table_cible, ccu.column_name AS colonne_cible
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('instruction','execution_rapport','verification','affectation','person_role','rni_lien_hierarchique')
ORDER BY tc.table_name, kcu.column_name;
