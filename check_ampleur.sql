-- R?partition r?elle des niveaux hi?rarchiques sur les 506 postes
SELECT niveau_hierarchique, count(*) FROM poste GROUP BY niveau_hierarchique ORDER BY niveau_hierarchique;

-- Combien d'unit?s ont un parent vs pas de parent, au total
SELECT count(*) AS total_unites,
       count(unite_parent_id) AS avec_parent
FROM unite_organisationnelle;

-- Les noms d'unit?s sont-ils standardis?s par institution (motif r?p?titif) ?
SELECT nom, count(*) FROM unite_organisationnelle GROUP BY nom ORDER BY count(*) DESC LIMIT 10;
