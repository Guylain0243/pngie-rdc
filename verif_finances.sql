-- 1. Hierarchie des unites du Ministere des Finances (avec parent)
SELECT 
  u.unite_id, u.nom, u.niveau_hierarchique, u.unite_parent_id,
  up.nom AS unite_parent_nom
FROM unite_organisationnelle u
LEFT JOIN unite_organisationnelle up ON up.unite_id = u.unite_parent_id
WHERE u.institution_id = (SELECT institution_id FROM institution WHERE nom ILIKE '%Finances%' LIMIT 1)
ORDER BY u.niveau_hierarchique;

-- 2. Pour chaque unite du Ministere, la distribution des niveau_hierarchique des postes qu'elle contient
SELECT 
  u.nom AS unite_nom, p.niveau_hierarchique AS poste_niveau, count(*) AS nb_postes
FROM poste p
JOIN unite_organisationnelle u ON u.unite_id = p.unite_id
WHERE u.institution_id = (SELECT institution_id FROM institution WHERE nom ILIKE '%Finances%' LIMIT 1)
GROUP BY u.nom, p.niveau_hierarchique
ORDER BY u.nom, p.niveau_hierarchique;
