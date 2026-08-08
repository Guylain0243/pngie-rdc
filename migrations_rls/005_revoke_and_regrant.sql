BEGIN;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM pngie_app;
\i 002_grants_pngie_app.sql
COMMIT;

SELECT count(DISTINCT table_name) AS nb_tables_avec_grant
FROM information_schema.role_table_grants WHERE grantee = 'pngie_app';

SELECT table_schema, table_name,
       string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE grantee = 'pngie_app'
GROUP BY table_schema, table_name
ORDER BY table_schema, table_name;