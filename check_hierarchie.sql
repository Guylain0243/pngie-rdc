SELECT poste_id, intitule, niveau_hierarchique, unite_id, poste_hierarchique_id
FROM poste
ORDER BY niveau_hierarchique
LIMIT 15;

SELECT unite_id, nom, unite_parent_id FROM unite_organisationnelle LIMIT 15;
