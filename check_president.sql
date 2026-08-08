SELECT poste_id, count(*) FROM affectation WHERE poste_id IN
  ('7ee6fba7-1973-423b-96d3-f0d820a4a4d1','21c4b4a8-8661-42c9-a34d-6739490f053c')
GROUP BY poste_id;
