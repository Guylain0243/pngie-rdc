const Database = require('better-sqlite3');
const db = new Database('db/test.db', { readonly: true });

console.log('=== Les 4 institutions de niveau 0 (racines) ===');
console.log(db.prepare(`
  SELECT o.organization_id, o.code, o.nom, ot.code as type_code, o.parent_id
  FROM organization o
  JOIN organization_type ot ON ot.id = o.type_id
  WHERE o.niveau = 0
`).all());

db.close();
