const Database = require('better-sqlite3');
const db = new Database('db/pngie.db', { readonly: true });

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();

console.log("=== LISTE DES TABLES ===");
tables.forEach(t => console.log(t.name));

console.log("\n=== SCHEMA DES TABLES CLES ===");
const keyTables = ['fonction', 'poste', 'poste_role_metier', 'role_metier', 'fiche_tome', 'institution', 'relations', 'relation', 'institution_relation'];

for (const tname of keyTables) {
    const exists = tables.some(t => t.name === tname);
    if (exists) {
        console.log(`\n--- ${tname} ---`);
        const cols = db.prepare(`PRAGMA table_info(${tname})`).all();
        cols.forEach(c => console.log(`  ${c.name} (${c.type})`));
        const count = db.prepare(`SELECT COUNT(*) as n FROM ${tname}`).get();
        console.log(`  [${count.n} lignes]`);
    } else {
        console.log(`\n--- ${tname} : N'EXISTE PAS ---`);
    }
}

console.log("\n=== TABLES CONTENANT 'relation' DANS LEUR NOM ===");
tables.filter(t => t.name.toLowerCase().includes('relation')).forEach(t => console.log(t.name));

console.log("\n=== TOUTES LES TABLES CONTENANT 'inst' ===");
tables.filter(t => t.name.toLowerCase().includes('inst')).forEach(t => console.log(t.name));

db.close();
