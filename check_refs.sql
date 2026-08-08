-- Postes candidats ? la suppression (niveau le plus eleve de chaque paire)
-- 6ccd7a06 (niv5), eb598923 (niv3), 1a344c8b (niv2), be0dc6bd (niv2),
-- 9379af2e (niv1), b0123d25 (niv2), 21c4b4a8 (niv0-doublon exact), 38e49409 (niv1)

SELECT 'poste_hierarchique_id' AS source, count(*) FROM poste WHERE poste_hierarchique_id IN
  ('6ccd7a06-c0b7-434b-8539-e06b89bb28dd','eb598923-4aa5-4e68-93b0-e7f795f0a610',
   '1a344c8b-8516-4f7e-b5a9-5543d9f26a53','be0dc6bd-5f02-4a5f-8f23-fae018ab3f9d',
   '9379af2e-be46-4cf5-8913-04687dacdc22','b0123d25-ef59-460f-8a7a-19793e64eee0',
   '21c4b4a8-8661-42c9-a34d-6739490f053c','38e49409-1743-4efc-acb8-fbab470a8dc1')
UNION ALL
SELECT 'personne_role via poste', count(*) FROM personne_role WHERE scope_institution_id IN
  ('6ccd7a06-c0b7-434b-8539-e06b89bb28dd','eb598923-4aa5-4e68-93b0-e7f795f0a610',
   '1a344c8b-8516-4f7e-b5a9-5543d9f26a53','be0dc6bd-5f02-4a5f-8f23-fae018ab3f9d',
   '9379af2e-be46-4cf5-8913-04687dacdc22','b0123d25-ef59-460f-8a7a-19793e64eee0',
   '21c4b4a8-8661-42c9-a34d-6739490f053c','38e49409-1743-4efc-acb8-fbab470a8dc1');

-- Lister toutes les tables ayant une colonne qui referencent poste (foreign keys)
SELECT tc.table_name, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'poste';
