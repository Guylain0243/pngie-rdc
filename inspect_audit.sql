-- 1. Structure des 4 tables d'audit existantes
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('journal_connexion','journal_audit_default','audit_log','journal_audit')
ORDER BY table_name, ordinal_position;

-- 2. Définition de la fonction existante fn_audit_generique
SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'fn_audit_generique';