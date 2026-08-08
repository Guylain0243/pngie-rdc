// ==============================================================
// TEST DE GENERALISATION - Batch 2 : permissions (securite)
// Le role 'MI' (deja utilise reellement pour les ministeres) peut
// lire/creer/modifier les 5 nouvelles entites, mais PAS les supprimer
// (refus par defaut - coherent avec la regle appliquee a "Facture").
//
// Usage : node 21-seed-permissions-batch2.js
// A executer depuis C:\pngie-rdc\pngie-backend, APRES 20-seed-workflow-batch2.js
// ==============================================================

const crypto = require('crypto');
const db = require('./src/db');

async function accorderPermission(roleCode, entity, action) {
    const existante = await db.get(
        'SELECT permission_id FROM meta_permission WHERE role_code = ? AND entity = ? AND action = ?',
        [roleCode, entity, action]
    );
    if (existante) {
        console.log(`(i) Permission ${roleCode}/${entity}/${action} existe deja - ignoree`);
        return;
    }
    await db.run(
        `INSERT INTO meta_permission (permission_id, role_code, entity, action) VALUES (?, ?, ?, ?)`,
        [crypto.randomUUID(), roleCode, entity, action]
    );
    console.log(`+-- Permission accordee : role "${roleCode}" peut "${action}" sur "${entity}"`);
}

async function main() {
    const entites = ['permis_minier', 'signalement_sanitaire', 'dossier_judiciaire', 'certificat_pki', 'dossier_recouvrement'];
    const actions = ['READ', 'CREATE', 'UPDATE']; // pas DELETE - refus par defaut volontaire

    for (const entity of entites) {
        for (const action of actions) {
            await accorderPermission('MI', entity, action);
        }
    }

    console.log('\nOK - Permissions accordees pour les 5 entites (role MI).');
    console.log('Rappel : aucune permission DELETE accordee - refus par defaut applicable partout.');
    console.log('\nProchaine etape : generer les 5 tables + API avec government-builder.js');
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
