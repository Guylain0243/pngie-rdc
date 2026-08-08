SELECT rolname, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole, rolconnlimit
FROM pg_roles WHERE rolname = 'pngie_app';

SELECT count(DISTINCT table_name) AS nb_tables_avec_grant
FROM information_schema.role_table_grants WHERE grantee = 'pngie_app';

SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'pngie_app'
ORDER BY table_name, privilege_type;