-- 1. Taux de remplissage de unite_parent_id sur toute la base
SELECT 
  count(*) AS total_unites,
  count(unite_parent_id) AS avec_parent,
  count(*) - count(unite_parent_id) AS sans_parent
FROM unite_organisationnelle;

-- 2. Combien de postes par unite, en moyenne / distribution
SELECT nb_postes, count(*) AS nb_unites
FROM (
  SELECT unite_id, count(*) AS nb_postes
  FROM poste
  GROUP BY unite_id
) sub
GROUP BY nb_postes
ORDER BY nb_postes;

-- 3. Existe-t-il une autre table qui ressemble a une hierarchie/rattachement de postes ?
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name ILIKE '%hierarch%' OR table_name ILIKE '%rattach%' OR table_name ILIKE '%organigramme%')
ORDER BY table_name;
