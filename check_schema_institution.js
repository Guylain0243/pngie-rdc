const Database = require('better-sqlite3');
const db = new Database('db/test.db', { readonly: true });

function show(table) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
    console.log(`${table}: [${cols.join(', ')}]`);
  } catch (e) {
    console.log(`${table}: ERREUR -> ${e.message}`);
  }
}

['institution','institution_type','organization','organization_type'].forEach(show);
db.close();
