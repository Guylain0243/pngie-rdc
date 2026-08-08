const Database = require('better-sqlite3');
const db = new Database('db\\pngie.db', { readonly: true });
const cibles = ['pouvoir', 'person', 'role', 'permission', 'role_permission', 'person_role', 'document_type', 'document', 'referentiel_national', 'referentiel_national_section', 'referentiel_national_item', 'meta_workflow_transition', 'meta_rule'];
let out = '';
for (const nom of cibles) {
    const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name = ?").get(nom);
    out += '-- ' + nom + '\n' + (row ? row.sql : 'INTROUVABLE') + '\n\n';
}
require('fs').writeFileSync('schema_migration_cible.txt', out, 'utf8');
console.log(out);
db.close();