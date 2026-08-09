// scripts/verify-institution-scope.js
// Alternative a psql (absent du PATH) : verifie l'etat reel de la policy
// institution_scope en base via le driver pg deja present en dependance.
// Charge .env.development a la main (meme convention que
// start-server-force-env.js / scripts/reset-test-users.js -- dotenv n'est
// pas une dependance du projet).
// Usage : node scripts/verify-institution-scope.js
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function chargerEnv(nomFichier) {
  const p = path.join(__dirname, '..', nomFichier);
  if (!fs.existsSync(p)) {
    console.error(`ERREUR : fichier ${nomFichier} introuvable a la racine du projet.`);
    process.exit(1);
  }
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx === -1) continue;
    process.env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
}

chargerEnv('.env.development');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    console.log('=== 1. Policy institution_scope active ===');
    const policy = await client.query(`
      SELECT policyname, permissive, roles, cmd, qual AS condition_using, with_check
      FROM pg_policies
      WHERE tablename = 'institution' AND policyname = 'institution_scope'
    `);
    if (policy.rows.length === 0) {
      console.log('AUCUNE POLICY TROUVEE sur institution_scope -- anomalie a investiguer.');
    } else {
      console.log(JSON.stringify(policy.rows[0], null, 2));
    }

    console.log('\n=== 2. Diagnostic : clause "IS NULL" presente ? ===');
    const qual = policy.rows[0] ? (policy.rows[0].condition_using || '') : '';
    if (/IS NULL/i.test(qual)) {
      console.log('PRESENTE -> version permissive (type fix_institution_policy.sql) active.');
      console.log('   Lecture autorisee meme sans app.current_institution_id defini (fail-open).');
    } else {
      console.log('ABSENTE -> version stricte (type fix_institution_rls.sql) active.');
      console.log("   Lecture refusee si app.current_institution_id n'est pas defini (fail-closed).");
    }

    console.log('\n=== 3. RLS actif ET forcé sur institution ? ===');
    const rls = await client.query(`
      SELECT relrowsecurity AS rls_active, relforcerowsecurity AS rls_forced
      FROM pg_class WHERE relname = 'institution'
    `);
    console.log(JSON.stringify(rls.rows[0], null, 2));

    console.log('\n=== 4. Toutes les policies actives (toutes tables) ===');
    const all = await client.query(`
      SELECT tablename, policyname, cmd FROM pg_policies ORDER BY tablename, policyname
    `);
    console.table(all.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('ERREUR :', err.message);
  process.exit(1);
});
