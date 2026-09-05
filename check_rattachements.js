const Database = require('better-sqlite3');
const db = new Database('db/test.db', { readonly: true });

console.log('=== 1. Les 5 INSTITUTION_CONTROLE : rattachement exact ===');
console.log(db.prepare(`
  SELECT o.organization_id, o.code, o.nom, o.parent_id, p.code as parent_code, p.nom as parent_nom
  FROM organization o
  JOIN organization_type ot ON ot.id = o.type_id
  LEFT JOIN organization p ON p.organization_id = o.parent_id
  WHERE ot.code = 'INSTITUTION_CONTROLE'
`).all());

console.log('\n=== 2. Les 26 provinces : rattachement exact (confirmation) ===');
console.log(db.prepare(`
  SELECT o.code, p.code as parent_code, p.nom as parent_nom, COUNT(*) as nb
  FROM organization o
  JOIN organization_type ot ON ot.id = o.type_id
  LEFT JOIN organization p ON p.organization_id = o.parent_id
  WHERE ot.code = 'PROVINCE'
  GROUP BY p.code
`).all());

console.log('\n=== 3. Les 42 ministeres : rattachement exact (confirmation) ===');
console.log(db.prepare(`
  SELECT p.code as parent_code, p.nom as parent_nom, COUNT(*) as nb
  FROM organization o
  JOIN organization_type ot ON ot.id = o.type_id
  LEFT JOIN organization p ON p.organization_id = o.parent_id
  WHERE ot.code = 'MINISTERE'
  GROUP BY p.code
'`).all());

db.close();
