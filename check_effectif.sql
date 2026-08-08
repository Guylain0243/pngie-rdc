SELECT p.poste_id, p.intitule, p.niveau_hierarchique, p.nombre_postes_autorises, p.unite_id
FROM poste p
WHERE (p.intitule, p.unite_id) IN (
  SELECT intitule, unite_id FROM poste GROUP BY intitule, unite_id HAVING count(*) > 1
)
ORDER BY p.intitule, p.niveau_hierarchique;
