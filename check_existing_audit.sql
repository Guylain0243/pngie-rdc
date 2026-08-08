-- 1. Tables liées à l'audit/journal
SELECT schemaname, tablename
FROM pg_tables
WHERE tablename ILIKE '%audit%' OR tablename ILIKE '%journal%';

-- 2. Fonctions/triggers existants liés au hash, 4 yeux, audit
SELECT proname, pronamespace::regnamespace AS schema
FROM pg_proc
WHERE proname ILIKE '%hash%' OR proname ILIKE '%4yeux%'
   OR proname ILIKE '%quatre%' OR proname ILIKE '%audit%';

-- 3. Colonnes de validation déjà présentes sur ordre_paiement (pour la règle des 4 yeux)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ordre_paiement'
ORDER BY ordinal_position;