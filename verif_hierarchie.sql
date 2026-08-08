-- 1. Est-ce que des postes partagent r?ellement une unite_id ?
SELECT unite_id, count(*) 
FROM poste 
GROUP BY unite_id 
HAVING count(*) > 1
ORDER BY count(*) DESC
LIMIT 10;

-- 2. La table unite_organisationnelle a-t-elle une hierarchie propre (parent) ?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'unite_organisationnelle'
ORDER BY ordinal_position;
