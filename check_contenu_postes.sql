-- 1. Combien de postes ont un contenu (missions) rempli vs vide
SELECT 
  count(*) AS total,
  count(missions) FILTER (WHERE missions IS NOT NULL AND missions != '') AS avec_missions,
  count(attributions) FILTER (WHERE attributions IS NOT NULL AND attributions != '') AS avec_attributions,
  count(poste_hierarchique_id) FILTER (WHERE poste_hierarchique_id IS NOT NULL) AS avec_hierarchie
FROM poste;

-- 2. Exemple concret d'un poste rempli (s'il en existe)
SELECT poste_id, intitule, missions, attributions, poste_hierarchique_id
FROM poste
WHERE missions IS NOT NULL AND missions != ''
LIMIT 3;

-- 3. Comment le titulaire est-il li? ? (chercher la vraie colonne)
SELECT column_name FROM information_schema.columns WHERE table_name = 'personne_role';
