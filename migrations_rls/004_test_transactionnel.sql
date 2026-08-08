\set ON_ERROR_STOP on

BEGIN;
SET ROLE pngie_app;
SELECT count(*) AS nb_institutions FROM institution;
SELECT count(*) AS nb_personnes FROM personne;
RESET ROLE;
ROLLBACK;

BEGIN;
SET ROLE pngie_app;
INSERT INTO personne (nom, prenom, password_hash)
VALUES ('TEST_ROLLBACK', 'TEST_ROLLBACK', 'test_hash_temporaire')
RETURNING personne_id AS personne_id_test;
SELECT count(*) AS lignes_journal_audit
FROM journal_audit WHERE created_at > now() - interval '10 seconds';
RESET ROLE;
ROLLBACK;

BEGIN;
SET ROLE pngie_app;
SELECT set_config('app.current_institution_id', (SELECT institution_id::text FROM institution LIMIT 1), true);
INSERT INTO document (titre, type_document_id, institution_id)
VALUES (
    'TEST_ROLLBACK',
    (SELECT type_document_id FROM type_document LIMIT 1),
    (SELECT institution_id FROM institution LIMIT 1)
)
RETURNING document_id AS document_id_test;
SELECT count(*) AS lignes_index_recherche
FROM index_recherche_global WHERE type_entite = 'document';
RESET ROLE;
ROLLBACK;

BEGIN;
SET ROLE pngie_app;
UPDATE rnsj_texte SET etat_juridique = etat_juridique
WHERE id_rnsj = (SELECT id_rnsj FROM rnsj_texte LIMIT 1);
SELECT count(*) AS lignes_historique FROM rnsj_texte_historique;
RESET ROLE;
ROLLBACK;

SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname = 'pngie_app';