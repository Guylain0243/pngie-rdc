-- db/migrations/journal/010_test_fixture_institution_mi.sql
-- Contexte : le test E2E 007_journal_national.test.js (et 006_agents.test.js)
-- reference une institution fixe INSTITUTION_MI = 8d3c813c-9d17-4da3-8dbc-95eaba52d94c
-- (documentee dans 006_agents.test.js comme 'MIN_0 (Interieur), corrige le
-- 08/08/2026 pour MI'), mais cette institution n'existe pas dans la base de
-- test actuelle, et le compte MI de test (person_id
-- e6b77d43-c1b9-4f65-bddc-20d6c2a275ad, email test-mi@pngie.local) a
-- scope_org_id = NULL dans person_role.
--
-- Les anciens scripts de seed (seed_test.sql, tests/fixtures/seed_test.sql)
-- sont obsoletes : ils referencent un schema anterieur (personne_role /
-- scope_institution_id au lieu de person_role / scope_org_id) et ne
-- correspondent ni au bon institution_id ni au bon person_id. Ils ne sont
-- pas rejoues ici.
--
-- Cette migration est une fixture de DONNEES DE TEST (E2E), pas une donnee
-- metier de production. Elle ne doit pas etre incluse dans un bootstrap
-- de production.
--
-- Portee : creation de l'institution manquante + rattachement du compte MI
-- de test. Aucune modification de policy RLS ni de permission RBAC.

BEGIN;

INSERT INTO institution (institution_id, code, nom, type_institution, statut)
VALUES (
  '8d3c813c-9d17-4da3-8dbc-95eaba52d94c',
  'TEST-MI-E2E',
  'Ministere de l''Interieur (fixture E2E)',
  'MINISTERE',
  'ACTIF'
)
ON CONFLICT (institution_id) DO NOTHING;

UPDATE person_role
SET scope_org_id = '8d3c813c-9d17-4da3-8dbc-95eaba52d94c'
WHERE person_id = 'e6b77d43-c1b9-4f65-bddc-20d6c2a275ad';

COMMIT;
