-- 1. audit_log est-il alimenté ?
SELECT count(*) AS nb_lignes FROM audit_log;

-- 2. Structure complète de audit_log
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'audit_log'
ORDER BY ordinal_position;

-- 3. Y a-t-il un trigger qui alimente audit_log ?
SELECT tgname, tgrelid::regclass AS table_cible, tgfoid::regproc AS fonction
FROM pg_trigger
WHERE NOT tgisinternal
  AND (tgfoid::regproc::text ILIKE '%hash%' OR tgrelid::regclass::text = 'audit_log');

-- 4. journal_audit contient-il déjà des données réelles ?
SELECT count(*) AS nb_lignes FROM journal_audit;