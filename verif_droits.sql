SELECT tablename, tableowner FROM pg_tables WHERE tablename IN ('delegation_pouvoir','institution','role','permission');
SELECT current_user;
SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'delegation_pouvoir'
ORDER BY grantee, privilege_type;
