const Database = require('better-sqlite3');
const db = new Database('db/test.db', { readonly: true });

console.log('=== 1. Nombre total de lignes organization ===');
console.log(db.prepare('SELECT COUNT(*) as total FROM organization').get());

console.log('\n=== 2. Repartition complete par type (deja vue, confirmation) ===');
console.log(db.prepare(`
  SELECT ot.code, ot.libelle, COUNT(*) as nb
  FROM organization o
  JOIN organization_type ot ON ot.id = o.type_id
  GROUP BY ot.code
  ORDER BY nb DESC
`).all());

console.log('\n=== 3. Lignes SANS type_id resolu (orphelines de organization_type) ===');
console.log(db.prepare(`
  SELECT o.organization_id, o.code, o.nom, o.type_id
  FROM organization o
  LEFT JOIN organization_type ot ON ot.id = o.type_id
  WHERE ot.id IS NULL
`).all());

console.log('\n=== 4. Lignes avec parent_id ne pointant vers aucune autre ligne organization (racines ou orphelines) ===');
console.log(db.prepare(`
  SELECT o.organization_id, o.code, o.nom, o.parent_id
  FROM organization o
  WHERE o.parent_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM organization p WHERE p.organization_id = o.parent_id)
`).all());

console.log('\n=== 5. Profondeur de hierarchie (niveau max) ===');
console.log(db.prepare(`
  SELECT niveau, COUNT(*) as nb
  FROM organization
  GROUP BY niveau
  ORDER BY niveau
`).all());

console.log('\n=== 6. Recherche de mots-cles evoquant une structure INTERNE (cabinet, direction, service, division, bureau, secretariat) ===');
console.log(db.prepare(`
  SELECT organization_id, code, nom
  FROM organization
  WHERE lower(nom) LIKE '%cabinet%'
     OR lower(nom) LIKE '%direction%'
     OR lower(nom) LIKE '%division%'
     OR lower(nom) LIKE '%bureau%'
     OR lower(nom) LIKE '%secretariat%'
     OR lower(nom) LIKE '%secrétariat%'
     OR lower(nom) LIKE '%service%'
`).all());

console.log('\n=== 7. Statut des lignes (actives / inactives) ===');
console.log(db.prepare(`
  SELECT statut, COUNT(*) as nb
  FROM organization
  GROUP BY statut
`).all());

console.log('\n=== 8. Colonnes utilisees vs colonnes institution (rappel du mapping) ===');
console.log('organization: organization_id, code, nom, type_id -> organization_type, parent_id, niveau, statut, description');
console.log('institution : institution_id, code, nom, sigle, type_institution (TEXT direct), institution_parent_id, niveau_hierarchique, statut, description, + champs additionnels (adresse, contact, etc.)');

db.close();
