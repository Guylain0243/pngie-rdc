// scripts/apply-001-consolidate-institution-scope.js
// Applique la migration de consolidation de institution_scope (version
// stricte, fail-closed). Nécessite le compte PROPRIETAIRE de la table
// institution (pngie_app ne suffit pas pour DROP/CREATE POLICY), donc on
// se connecte avec .env.admin.local -- meme convention que scripts/run-007.js.
// Usage : node scripts/apply-001-consolidate-institution-scope.js
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function chargerEnv(nomFichier) {
  const p = path.join(__dirname, '..', nomFichier);
  if (!fs.existsSync(p)) {
    console.error(`ERREUR : fichier ${nomFichier} introuvable a la racine du projet.`);
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

// .env.development sert seulement a recuperer le nom de la base (meme base
// que l'application). Les identifiants viennent de .env.admin.local (superuser).
const envDev = chargerEnv('.env.development');
const admin = chargerEnv('.env.admin.local');

let database = 'pngie_rdc_rls_test';
const m = (envDev.DATABASE_URL || '').match(/\/([^/?]+)(\?|$)/);
if (m) database = m[1];

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: admin.PGSUPERUSER,
  password: admin.PGSUPERUSER_PASSWORD,
  database,
});

async function etatActuel(label) {
  const policy = await client.query(`
    SELECT policyname, qual AS condition_using
    FROM pg_policies WHERE tablename = 'institution' AND policyname = 'institution_scope'
  `);
  console.log(`--- Etat ${label} ---`);
  console.log(policy.rows[0] ? policy.rows[0].condition_using : '(aucune policy trouvee)');
}

async function main() {
  await client.connect();
  try {
    await etatActuel('AVANT');

    await client.query('BEGIN');

    await client.query('DROP POLICY IF EXISTS institution_scope ON institution');

    await client.query(`
      CREATE POLICY institution_scope ON institution
      FOR ALL
      USING (
          COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
          OR institution_id = (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
          OR institution_id IN (
              SELECT institution_id FROM fn_institutions_descendantes(
                  (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
              )
          )
      )
      WITH CHECK (
          COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
          OR institution_id = (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
          OR institution_id IN (
              SELECT institution_id FROM fn_institutions_descendantes(
                  (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
              )
          )
      )
    `);

    await client.query('ALTER TABLE institution ENABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE institution FORCE ROW LEVEL SECURITY');

    await client.query('COMMIT');
    console.log('\nMigration appliquee et validee (COMMIT).\n');

    await etatActuel('APRES');

    const rls = await client.query(`
      SELECT relrowsecurity AS rls_active, relforcerowsecurity AS rls_forced
      FROM pg_class WHERE relname = 'institution'
    `);
    console.log('RLS actif/force :', JSON.stringify(rls.rows[0]));

    console.log('\nIMPORTANT : lancer la suite E2E maintenant :');
    console.log('  node --test tests/e2e/*.test.js');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ERREUR -- ROLLBACK effectue, aucune modification appliquee :', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
