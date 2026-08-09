// scripts/apply-governance-phase3-migrations.js
// Applique les 4 migrations Phase 3 du Cockpit Gouvernemental, dans l'ordre,
// avec le compte admin (necessaire pour ALTER TABLE / CREATE TABLE).
// Usage : node scripts/apply-governance-phase3-migrations.js
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function chargerEnv(nomFichier) {
  const p = path.join(__dirname, '..', nomFichier);
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx === -1) continue;
    env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
  return env;
}

const envDev = chargerEnv('.env.development');
const admin = chargerEnv('.env.admin.local');
let database = 'pngie_rdc_rls_test';
const m = (envDev.DATABASE_URL || '').match(/\/([^/?]+)(\?|$)/);
if (m) database = m[1];

const client = new Client({
  host: 'localhost', port: 5432,
  user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
  database,
});

const MIGRATIONS = [
  'db/migrations/governance/001_role_lecture_nationale.sql',
  'db/migrations/governance/002_decision_gouvernementale_colonnes_workflow.sql',
  'db/migrations/governance/003_decision_workflow_transition.sql',
  'db/migrations/governance/004_permissions_governance.sql',
];

async function main() {
  await client.connect();
  for (const rel of MIGRATIONS) {
    const p = path.join(__dirname, '..', rel);
    if (!fs.existsSync(p)) {
      console.error(`ERREUR : fichier introuvable : ${rel}`);
      process.exit(1);
    }
    let sql = fs.readFileSync(p, 'utf8');
    if (sql.charCodeAt(0) === 0xFEFF) sql = sql.slice(1);
    console.log(`\n--- Application de ${rel} ---`);
    try {
      await client.query(sql);
      console.log('OK.');
    } catch (err) {
      console.error(`ERREUR sur ${rel} :`, err.message);
      process.exit(1);
    }
  }

  console.log('\n=== Verification finale ===');
  const role = await client.query(`SELECT code, nom, lecture_nationale FROM role WHERE code = 'ANALYSTE_COCKPIT'`);
  console.log('Role Analyste Cockpit :', JSON.stringify(role.rows[0]));

  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'decision_gouvernementale' AND column_name IN
    ('cree_par','date_publication','publie_par','date_archivage','archive_par')
    ORDER BY column_name
  `);
  console.log('Colonnes workflow ajoutees :', cols.rows.map(r => r.column_name).join(', '));

  const transitions = await client.query(`SELECT statut_origine, statut_cible, permission_requise FROM decision_workflow_transition ORDER BY id`);
  console.log('Transitions :');
  console.table(transitions.rows);

  const perms = await client.query(`
    SELECT r.code, p.entite, p.action FROM permission p JOIN role r ON r.role_id = p.role_id
    WHERE p.entite IN ('decision_gouvernementale', 'decision_action') ORDER BY r.code, p.entite, p.action
  `);
  console.log('Matrice RBAC :');
  console.table(perms.rows);

  await client.end();
}

main().catch((err) => { console.error('ERREUR :', err.message); process.exit(1); });
