SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'institution' AND grantee = 'pngie_app'
ORDER BY privilege_type;
