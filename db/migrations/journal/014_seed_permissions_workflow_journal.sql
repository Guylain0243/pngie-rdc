-- 014_seed_permissions_workflow_journal.sql
-- Les transitions du workflow acte_workflow_transition exigent des permissions
-- (journal.modifier, journal.valider, journal.signer, journal.publier, journal.archiver)
-- qui n'ont jamais ete inserees dans la table permission. Seul journal.creer existait.
-- Ce correctif accorde ces permissions au role PM, qui pilote le cycle de vie complet
-- de l'acte dans le processus metier (cf. tests/e2e/007_journal_national.test.js).
INSERT INTO permission (role_id, entite, action)
SELECT role_id, 'journal', action
FROM role
CROSS JOIN (VALUES ('modifier'), ('valider'), ('signer'), ('publier'), ('archiver')) AS a(action)
WHERE code = 'PM'
ON CONFLICT (role_id, entite, action) DO NOTHING;