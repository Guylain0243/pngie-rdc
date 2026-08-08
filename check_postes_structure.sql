SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'poste'
ORDER BY ordinal_position;

SELECT count(*) AS total_postes FROM poste;
SELECT count(*) AS postes_avec_titulaire FROM poste WHERE personne_id IS NOT NULL;
