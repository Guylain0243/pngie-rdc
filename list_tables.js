const Database = require('better-sqlite3');
const db = new Database('C:/pngie-rdc/pngie-backend/db/pngie.db', { readonly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach(function(t) { console.log(t.name); });
db.close();
