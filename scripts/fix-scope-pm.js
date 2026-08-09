// scripts/fix-scope-pm.js
// Aligne personne_role.scope_institution_id de test-pm@pngie.local sur son
// affectation physique reelle (deja correcte : poste rattache a Primature).
// Meme classe de correctif que celui applique a MI dans le chantier
// precedent (scope_institution_id desynchronise de l'affectation physique).
// Usage : node scripts/fix-scope-pm.js
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

const PRIMATURE_ID = 'ae011056-e941-4cb0-9504-9d1478324fc5';

const client = new Client({
  host: 'localhost', port: 5432,
  user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
  database,
});

async function main() {
  await client.connect();

  const avant = await client.query(`
    SELECT pr.scope_institution_id
    FROM personne p JOIN personne_role pr ON pr.personne_id = p.personne_id
    WHERE p.email = 'test-pm@pngie.local'
  `);
  console.log('Avant :', JSON.stringify(avant.rows[0]));

  await client.query('BEGIN');
  const upd = await client.query(`
    UPDATE personne_role SET scope_institution_id = $1
    WHERE personne_id = (SELECT personne_id FROM personne WHERE email = 'test-pm@pngie.local')
  `, [PRIMATURE_ID]);
  console.log('Lignes modifiees :', upd.rowCount);
  await client.query('COMMIT');

  const apres = await client.query(`
    SELECT pr.scope_institution_id, i.nom
    FROM personne p
    JOIN personne_role pr ON pr.personne_id = p.personne_id
    JOIN institution i ON i.institution_id = pr.scope_institution_id
    WHERE p.email = 'test-pm@pngie.local'
  `);
  console.log('Apres :', JSON.stringify(apres.rows[0]));

  await client.end();
}

main().catch(async (err) => {
  console.error('ERREUR :', err.message);
  try { await client.query('ROLLBACK'); } catch {}
  process.exit(1);
});
