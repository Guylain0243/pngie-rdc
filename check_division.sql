SELECT poste_id, count(*) FROM affectation WHERE poste_id IN
  ('55b49540-9c0a-40a7-81b7-7ee2d5756b12','6ccd7a06-c0b7-434b-8539-e06b89bb28dd')
GROUP BY poste_id;
