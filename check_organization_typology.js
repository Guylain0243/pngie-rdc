const Database = require('better-sqlite3');
const db = new Database('db/test.db', { readonly: true });

console.log('--- Repartition organization par type ---');
console.log(db.prepare(`
  SELECT ot.code, ot.libelle, COUNT(*) as nb
  FROM organization o
  JOIN organization_type ot ON ot.id = o.type_id
  GROUP BY ot.code
  ORDER BY nb DESC
`).all());

console.log('--- Echantillon organization avec parent_id (hierarchie interne ?) ---');
console.log(db.prepare(`
  SELECT organization_id, code, nom, type_id, parent_id
  FROM organization
  WHERE parent_id IS NOT NULL
  LIMIT 10
`).all());

db.close();
