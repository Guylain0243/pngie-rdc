\set ON_ERROR_STOP on
\echo ===== PRECHECK - PNGIE-RDC Migration RLS =====
SELECT current_database() = 'pngie_rdc' AS ok \gset
\if :ok
    \echo 'OK  - connecte a la bonne base (pngie_rdc)'
\else
    \echo 'ERREUR CRITIQUE : mauvaise base. ARRET.'
    \quit
\endif
SELECT current_user AS val \gset info_
\echo Utilisateur connecte : :info_val
SELECT current_setting('server_version') AS val \gset info_
\echo Version PostgreSQL   : :info_val
SELECT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pngie_app') AS role_exists \gset
\if :role_exists
    SELECT (NOT rolsuper AND NOT rolbypassrls) AS role_safe FROM pg_roles WHERE rolname = 'pngie_app' \gset
    \if :role_safe
        \echo 'OK  - pngie_app existe deja et est correctement restreint'
    \else
        \echo 'ERREUR CRITIQUE : pngie_app a des privileges eleves. ARRET.'
        \quit
    \endif
    SELECT count(DISTINCT table_name) AS val FROM information_schema.role_table_grants WHERE grantee = 'pngie_app' \gset info_
    \echo Tables avec GRANT actuellement : :info_val
\else
    \echo 'INFO - pngie_app n existe pas encore.'
\endif
\echo
\echo ===== PRECHECK TERMINE =====