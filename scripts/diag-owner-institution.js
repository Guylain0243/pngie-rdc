// scripts/diag-owner-institution.js
// Diagnostic : pourquoi la migration echoue avec "doit etre le proprietaire"
// meme en utilisant .env.admin.local. Verifie qui est vraiment connecte,
// s'il est superuser, et qui possede reellement la table institution.
// Usage : node scripts/diag-owner-institution.js
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function chargerEnv(nomFichier) {
  const p = path.join(__dirname, '..', nomFichier);
  if (!fs.existsSync(p)) {
    console.error(`ERREUR : fichier ${nomFichier} introuvable.`);
    process.exit(1);
  }
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

console.log('Valeurs lues dans .env.admin.local :');
console.log('  PGSUPERUSER =', JSON.stringify(admin.PGSUPERUSER));
console.log('  PGSUPERUSER_PASSWORD =', admin.PGSUPERUSER_PASSWORD ? `(definie, ${admin.PGSUPERUSER_PASSWORD.length} caracteres)` : '(VIDE/ABSENTE)');

let database = 'pngie_rdc_rls_test';
const m = (envDev.DATABASE_URL || '').match(/\/([^/?]+)(\?|$)/);
if (m) database = m[1];
console.log('  Base ciblee =', database);

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: admin.PGSUPERUSER,
  password: admin.PGSUPERUSER_PASSWORD,
  database,
});

async function main() {
  await client.connect();

  const who = await client.query('SELECT current_user, session_user');
  console.log('\nconnecte en tant que :', JSON.stringify(who.rows[0]));

  const roleInfo = await client.query(
    `SELECT rolname, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb
     FROM pg_roles WHERE rolname = current_user`
  );
  console.log('\nAttributs du role connecte :', JSON.stringify(roleInfo.rows[0]));

  const owner = await client.query(
    `SELECT c.relname, r.rolname AS proprietaire
     FROM pg_class c JOIN pg_roles r ON r.oid = c.relowner
     WHERE c.relname = 'institution'`
  );
  console.log('\nProprietaire reel de la table institution :', JSON.stringify(owner.rows[0]));

  await client.end();
}

main().catch((err) => {
  console.error('ERREUR :', err.message);
  process.exit(1);
});
