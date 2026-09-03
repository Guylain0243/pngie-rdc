-- db/migrations/journal/009_grant_mi_journal_creer.sql
-- Contexte : le role MI (Ministere de l'Interieur, scope institution) n'avait
-- aucune permission sur l'entite journal, contrairement a PM (scope national)
-- qui avait deja recu creer/modifier/valider/signer/publier/archiver lors
-- d'une session precedente.
-- Portee volontairement minimale (principe du moindre privilege) : seule
-- l'action 'creer' est accordee ici, car c'est la seule exigee par le test
-- E2E 007_journal_national.test.js, sous-bloc 007c ("Creation d'un acte
-- scope institution MI -> 201"). Aucune autre action (modifier, valider,
-- signer, publier, archiver) n'est demontree necessaire par un test ou une
-- specification metier a ce jour. A completer uniquement sur preuve
-- (nouveau test en echec ou regle metier documentee).

INSERT INTO permission (role_id, entite, action)
SELECT role_id, 'journal', 'creer'
FROM role
WHERE code = 'MI'
ON CONFLICT DO NOTHING;