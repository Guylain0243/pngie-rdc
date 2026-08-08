const Database = require('better-sqlite3');
const db = new Database('db\\pngie.db', { readonly: true });
const rows = db.prepare('SELECT * FROM meta_workflow_transition LIMIT 5').all();
console.log(JSON.stringify(rows, null, 2));
db.close();