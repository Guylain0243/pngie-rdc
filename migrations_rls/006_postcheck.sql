\set ON_ERROR_STOP on
\echo ===== POSTCHECK =====

SELECT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pngie_app') AS role_exists \gset
\if :role_exists
    \echo 'OK  - role pngie_app present'
\else
    \echo 'ERREUR CRITIQUE : role introuvable. ARRET.'
    \quit
\endif

SELECT (NOT rolsuper AND NOT rolbypassrls) AS role_safe
FROM pg_roles WHERE rolname = 'pngie_app' \gset
\if :role_safe
    \echo 'OK  - rolsuper=false, rolbypassrls=false'
\else
    \echo 'ERREUR CRITIQUE : privileges eleves detectes. ARRET.'
    \quit
\endif

SELECT count(DISTINCT table_name) AS val
FROM information_schema.role_table_grants WHERE grantee = 'pngie_app' \gset info_
\echo Nombre de tables avec GRANT : :info_val (attendu 87 ou 88)

SELECT count(*) AS val FROM information_schema.role_table_grants
WHERE grantee = 'pngie_app' AND table_name LIKE 'rnso_%' \gset info_
\echo Tables rnso_* restantes : :info_val (attendu 0)

SELECT count(*) AS val FROM information_schema.role_table_grants
WHERE grantee = 'pngie_app' AND table_name IN (
  'ref_gouvernorat','service_public','meta_attribute','meta_entity',
  'ref_cour_appel','ref_cour_appel_historique',
  'ref_tribunal_militaire_garnison','ref_tribunal_militaire_garnison_historique'
) \gset info_
\echo Tables hors perimetre restantes : :info_val (attendu 0)

SELECT count(*) AS val FROM information_schema.role_table_grants
WHERE grantee = 'pngie_app' AND privilege_type IN ('TRUNCATE','TRIGGER','REFERENCES') \gset info_
\echo Privileges dangereux restants : :info_val (attendu 0)

SELECT string_agg(relname || '=' || relrowsecurity::text, ', ' ORDER BY relname) AS val
FROM pg_class WHERE relname IN (
  'personne_role','document','index_recherche_global','institution',
  'rnsj_texte','rnsj_relation','rnsj_modification','rnsj_texte_historique'
) AND relnamespace = 'public'::regnamespace \gset info_
\echo Statut RLS (8 tables auditees) : :info_val

SELECT string_agg(DISTINCT tablename, ', ' ORDER BY tablename) AS val
FROM pg_policies WHERE tablename IN (
  'personne_role','document','index_recherche_global','institution',
  'rnsj_texte','rnsj_relation','rnsj_modification','rnsj_texte_historique'
) \gset info_
\echo Tables avec politique RLS : :info_val

\echo
\echo ===== POSTCHECK TERMINE =====