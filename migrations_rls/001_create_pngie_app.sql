SELECT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pngie_app') AS role_exists \gset
\if :role_exists
\echo 'Le role pngie_app existe deja - aucune action.'
\else
CREATE ROLE pngie_app WITH
  LOGIN
  PASSWORD :'pngie_app_password'
  NOSUPERUSER
  NOBYPASSRLS
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION
  CONNECTION LIMIT 20;
\echo 'Role pngie_app cree.'
\endif
SELECT rolname, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole, rolconnlimit
FROM pg_roles WHERE rolname = 'pngie_app';