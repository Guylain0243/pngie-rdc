SELECT column_name FROM information_schema.columns WHERE table_name = 'unite_organisationnelle';

-- Exemple concret : tous les postes d'une seule institution avec leur niveau, pour voir la structure r?elle
SELECT p.poste_id, p.intitule, p.niveau_hierarchique, p.unite_id, u.institution_id, u.nom AS unite_nom
FROM poste p
JOIN unite_organisationnelle u ON p.unite_id = u.unite_id
WHERE u.institution_id = (SELECT institution_id FROM institution WHERE nom ILIKE '%Finances%' LIMIT 1)
ORDER BY p.niveau_hierarchique;
