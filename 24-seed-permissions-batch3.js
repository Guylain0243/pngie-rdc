// ==============================================================
// COUVERTURE COMPLETE DES 32 DOMAINES - Batch 3 : permissions
// Le role 'MI' (Ministeres) recoit READ/CREATE/UPDATE sur les 27
// nouvelles entites - jamais DELETE (refus par defaut, coherent
// avec toutes les entites precedentes).
//
// Usage : node 24-seed-permissions-batch3.js
// A executer depuis C:\pngie-rdc\pngie-backend, APRES 23-seed-workflow-batch3.js
// ==============================================================

const crypto = require('crypto');
const db = require('./src/db');

async function accorderPermission(roleCode, entity, action) {
    const existante = await db.get(
        'SELECT permission_id FROM meta_permission WHERE role_code = ? AND entity = ? AND action = ?',
        [roleCode, entity, action]
    );
    if (existante) { console.log(`(i) ${roleCode}/${entity}/${action} existe deja`); return; }
    await db.run(
        `INSERT INTO meta_permission (permission_id, role_code, entity, action) VALUES (?, ?, ?, ?)`,
        [crypto.randomUUID(), roleCode, entity, action]
    );
    console.log(`+-- Permission : role "${roleCode}" peut "${action}" sur "${entity}"`);
}

const ENTITES = [
  'decision_institutionnelle', 'dossier_administratif', 'reclamation_citoyenne',
  'dossier_entreprise', 'dossier_agent_rh', 'ligne_budgetaire', 'ordre_paiement',
  'ecriture_comptable', 'declaration_fiscale', 'declaration_douaniere',
  'bien_patrimonial', 'appel_offres', 'dossier_projet_investissement',
  'incident_securitaire', 'dossier_logistique_defense', 'dossier_scolaire',
  'exploitation_agricole', 'raccordement_energetique', 'licence_commerciale',
  'autorisation_industrielle', 'immatriculation_vehicule', 'licence_telecom',
  'etude_impact_environnemental', 'bien_culturel_protege', 'federation_sportive',
  'projet_recherche', 'accord_cooperation', 'plan_developpement', 'enquete_statistique',
];

async function main() {
    const actions = ['READ', 'CREATE', 'UPDATE']; // pas DELETE - refus par defaut volontaire
    for (const entity of ENTITES) {
        for (const action of actions) {
            await accorderPermission('MI', entity, action);
        }
    }
    console.log(`\nOK - Permissions accordees pour ${ENTITES.length} entites (role MI).`);
    console.log('Rappel : aucune permission DELETE accordee - refus par defaut applicable partout.');
    console.log('\nProchaine etape : generer les tables + API avec government-builder.js pour chaque entite (voir liste ci-dessous).');
    console.log(ENTITES.map(e => `node government-builder.js ${e}`).join('\n'));
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
