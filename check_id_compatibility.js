const Database = require('better-sqlite3');
const db = new Database('db/test.db', { readonly: true });

function showTypes(table) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    console.log(`--- ${table} ---`);
    cols.forEach(c => console.log(`  ${c.name}: ${c.type}`));
  } catch (e) {
    console.log(`${table}: ERREUR -> ${e.message}`);
  }
}

showTypes('organization');
showTypes('institution');

console.log('--- Echantillon organization_id (organization) ---');
console.log(db.prepare('SELECT organization_id FROM organization LIMIT 5').all());

console.log('--- Echantillon institution_id (institution) ---');
console.log(db.prepare('SELECT institution_id FROM institution LIMIT 5').all());

console.log('--- Echantillon emetteur_org_id (instruction) ---');
console.log(db.prepare('SELECT DISTINCT emetteur_org_id FROM instruction LIMIT 5').all());

db.close();
