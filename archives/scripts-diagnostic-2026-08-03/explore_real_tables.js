const Database = require('better-sqlite3');
const db = new Database('C:/pngie-rdc/pngie-backend/db/pngie.db', { readonly: true });

const targets = [
    'organization', 'organization_mission', 'organization_responsabilite', 'organization_type',
    'position', 'position_responsabilite', 'position_competence', 'position_document',
    'position_kpi', 'position_menu', 'position_workflow', 'position_interaction', 'position_droit_acces',
    'person', 'person_role',
    'role', 'role_permission',
    'responsabilite', 'competence', 'mission',
    'entity_relation', 'gov_relation',
    'unit'
];

for (const tname of targets) {
    console.log('\n--- ' + tname + ' ---');
    try {
        const cols = db.prepare('PRAGMA table_info(' + tname + ')').all();
        cols.forEach(function(c) {
            console.log('  ' + c.name + ' (' + c.type + ')');
        });
        const count = db.prepare('SELECT COUNT(*) as n FROM ' + tname).get();
        console.log('  [' + count.n + ' lignes]');
    } catch (e) {
        console.log('  ERREUR: ' + e.message);
    }
}

db.close();
