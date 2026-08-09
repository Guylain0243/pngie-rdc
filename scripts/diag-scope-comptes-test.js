// scripts/diag-scope-comptes-test.js
// Verifie l'etat reel de personne_role.scope_institution_id pour les 6
// comptes de test, afin de confirmer si le mecanisme "scope national" passe
// par un institutionId NULL (legacy, cf. migration 006 Journal) ou par une
// institution racine explicite + hierarchie (mecanisme actuel suppose).
// Usage : node scripts/diag-scope-comptes-test.js
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

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT p.email, pr.scope_institution_id, i.nom AS institution_nom, i.institution_parent_id
    FROM personne p
    JOIN personne_role pr ON pr.personne_id = p.personne_id
    LEFT JOIN institution i ON i.institution_id = pr.scope_institution_id
    WHERE p.email IN (
      'test-an@pngie.local','test-gv@pngie.local','test-mi@pngie.local',
      'test-pm@pngie.local','test-pr@pngie.local','test-sn@pngie.local'
    )
    ORDER BY p.email
  `);
  console.table(res.rows);
  await client.end();
}

main().catch((err) => { console.error('ERREUR :', err.message); process.exit(1); });
