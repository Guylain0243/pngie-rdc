const Database = require('better-sqlite3');
const db = new Database('db\\pngie.db', { readonly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
let lines = [];
for (let i = 0; i < tables.length; i++) {
    const name = tables[i].name;
    try {
        const row = db.prepare('SELECT COUNT(*) AS n FROM ' + name).get();
        if (row.n > 0) {
            lines.push(name + ' : ' + row.n);
        }
    } catch (e) {
        lines.push(name + ' : ERREUR ' + e.message);
    }
}
const out = lines.join('\n');
require('fs').writeFileSync('tables_avec_donnees.txt', out, 'utf8');
console.log(out);
console.log('Termine.');
db.close();