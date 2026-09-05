const Database = require('better-sqlite3');
const db = new Database('db/test.db', { readonly: true });
console.log(db.prepare('PRAGMA table_info(personne)').all().map(c => c.name));
db.close();
