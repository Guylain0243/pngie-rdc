-- Existe-t-il une colonne identifiant le chef/titulaire responsable d'une unit? ?
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'poste'
ORDER BY ordinal_position;
