BEGIN;

DELETE FROM poste WHERE poste_id IN (
  '6ccd7a06-c0b7-434b-8539-e06b89bb28dd',
  'cf13ec7a-5b6f-4dce-9250-abc91be52740',
  '1dc98308-3e53-417f-b04a-05a8e8b68ac0',
  '8f0a1132-22c5-4fb2-b9ff-6aaeb3d81f3e',
  '42112e8f-805c-46ca-a5db-a37676a8c62f',
  '2a0793eb-a1ce-4174-8959-aea71ec92b2c',
  '21c4b4a8-8661-42c9-a34d-6739490f053c',
  '643c7ccb-0dab-42a7-ad4c-cb2c4b3861ae'
);

-- Verification avant de valider : on doit voir 498 (506 - 8)
SELECT count(*) AS total_apres_suppression FROM poste;

-- Verification qu'aucun doublon d'intitule+unite_id ne subsiste
SELECT count(*) FROM (
  SELECT intitule, unite_id FROM poste GROUP BY intitule, unite_id HAVING count(*) > 1
) sub;

COMMIT;
