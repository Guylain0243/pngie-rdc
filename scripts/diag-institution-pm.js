// scripts/diag-institution-pm.js
// Cherche une institution correspondant a la Primature / au Premier Ministre,
// pour savoir vers quoi pointer test-pm@pngie.local (actuellement NULL).
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

  console.log('=== Institutions dont le nom contient "Primature" ou "Premier" ===');
  const primature = await client.query(`
    SELECT institution_id, nom, institution_parent_id
    FROM institution
    WHERE nom ILIKE '%primature%' OR nom ILIKE '%premier ministre%'
  `);
  console.table(primature.rows);

  console.log('\n=== Institutions racines (institution_parent_id IS NULL) ===');
  const racines = await client.query(`
    SELECT institution_id, nom FROM institution WHERE institution_parent_id IS NULL
  `);
  console.table(racines.rows);

  console.log('\n=== A quelle affectation/poste physique PM est-il rattache (si existant) ? ===');
  const affectationPM = await client.query(`
    SELECT p.email, a.statut, po.poste_id, u.unite_id, i.nom AS institution_physique
    FROM personne p
    LEFT JOIN affectation a ON a.personne_id = p.personne_id AND a.statut = 'ACTIF' AND a.date_fin IS NULL
    LEFT JOIN poste po ON po.poste_id = a.poste_id
    LEFT JOIN unite_organisationnelle u ON u.unite_id = po.unite_id
    LEFT JOIN institution i ON i.institution_id = u.institution_id
    WHERE p.email = 'test-pm@pngie.local'
  `);
  console.table(affectationPM.rows);

  await client.end();
}

main().catch((err) => { console.error('ERREUR :', err.message); process.exit(1); });
