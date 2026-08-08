SELECT poste_id, intitule, niveau_hierarchique, created_at
FROM poste
WHERE poste_id IN (
  '55b49540-9c0a-40a7-81b7-7ee2d5756b12','6ccd7a06-c0b7-434b-8539-e06b89bb28dd',
  'cf13ec7a-5b6f-4dce-9250-abc91be52740','eb598923-4aa5-4e68-93b0-e7f795f0a610',
  '1dc98308-3e53-417f-b04a-05a8e8b68ac0','1a344c8b-8516-4f7e-b5a9-5543d9f26a53',
  '8f0a1132-22c5-4fb2-b9ff-6aaeb3d81f3e','be0dc6bd-5f02-4a5f-8f23-fae018ab3f9d',
  '42112e8f-805c-46ca-a5db-a37676a8c62f','9379af2e-be46-4cf5-8913-04687dacdc22',
  '2a0793eb-a1ce-4174-8959-aea71ec92b2c','b0123d25-ef59-460f-8a7a-19793e64eee0',
  '7ee6fba7-1973-423b-96d3-f0d820a4a4d1','21c4b4a8-8661-42c9-a34d-6739490f053c',
  '643c7ccb-0dab-42a7-ad4c-cb2c4b3861ae','38e49409-1743-4efc-acb8-fbab470a8dc1'
)
ORDER BY intitule, created_at;
