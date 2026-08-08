SELECT poste_id, count(*) FROM affectation WHERE poste_id IN
  ('6ccd7a06-c0b7-434b-8539-e06b89bb28dd','eb598923-4aa5-4e68-93b0-e7f795f0a610',
   '1a344c8b-8516-4f7e-b5a9-5543d9f26a53','be0dc6bd-5f02-4a5f-8f23-fae018ab3f9d',
   '9379af2e-be46-4cf5-8913-04687dacdc22','b0123d25-ef59-460f-8a7a-19793e64eee0',
   '21c4b4a8-8661-42c9-a34d-6739490f053c','38e49409-1743-4efc-acb8-fbab470a8dc1')
GROUP BY poste_id;

-- Structure de la table affectation pour bien comprendre son role
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'affectation' ORDER BY ordinal_position;
