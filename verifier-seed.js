const db = require('./src/db');

const TABLES = [
  'organization',
  'organization_type',
  'unit',
  'position',
  'person',
  'person_role',
  'assignment',
  'role',
  'mission',
  'organization_mission',
  'rapport',
  'controle',
  'audit_mission',
  'recommandation',
  'decision',
  'suivi',
  'systeme_externe',
  'integration_flux',
  'nocode_app',
  'service_numerique',
  'lieu',
  'emploi_type',
  'competence',
  'position_competence',
  'document_type'
];

async function main() {
  console.log('--- Comptage des lignes par table ---\n');
  for (const table of TABLES) {
    try {
      const row = await db.get(`SELECT COUNT(*) as n FROM ${table}`);
      const marker = row.n === 0 ? '  <-- VIDE (attention)' : '';
      console.log(`${table.padEnd(25)} : ${String(row.n).padStart(5)}${marker}`);
    } catch (err) {
      console.log(`${table.padEnd(25)} : ERREUR (${err.message})`);
    }
  }
}

main()
  .then(() => { process.exitCode = 0; })
  .catch(err => {
    console.error('ERREUR GENERALE :', err.message);
    process.exitCode = 1;
  });
