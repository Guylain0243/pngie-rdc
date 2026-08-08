SELECT 
  p.poste_id, p.intitule, p.niveau_hierarchique, p.unite_id,
  sup.poste_id AS superieur_id, sup.intitule AS superieur_intitule, sup.niveau_hierarchique AS superieur_niveau
FROM poste p
LEFT JOIN LATERAL (
  SELECT poste_id, intitule, niveau_hierarchique
  FROM poste p2
  WHERE p2.unite_id = p.unite_id
    AND p2.niveau_hierarchique < p.niveau_hierarchique
  ORDER BY p2.niveau_hierarchique DESC
  LIMIT 1
) sup ON true
WHERE p.unite_id IN (
  SELECT unite_id FROM unite_organisationnelle
  WHERE institution_id = (SELECT institution_id FROM institution WHERE nom ILIKE '%Finances%' LIMIT 1)
)
ORDER BY p.niveau_hierarchique;
