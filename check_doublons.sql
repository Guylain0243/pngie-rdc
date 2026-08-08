SELECT intitule, unite_id, count(*) AS nb, array_agg(niveau_hierarchique ORDER BY niveau_hierarchique) AS niveaux
FROM poste
GROUP BY intitule, unite_id
HAVING count(*) > 1
ORDER BY nb DESC
LIMIT 20;

SELECT count(*) FROM (
  SELECT intitule, unite_id FROM poste GROUP BY intitule, unite_id HAVING count(*) > 1
) sub;
