/**
 * Sprint 4 - Découverte : meta_permission est une VUE, pas une table.
 * Ce script récupère sa définition SQL pour trouver la vraie table
 * sous-jacente sur laquelle il faut réellement insérer.
 *
 * ⚠️ LECTURE SEULE.
 *
 * Usage :
 *   $env:DATABASE_URL = "postgresql://pngie_app@localhost:5432/pngie_rdc_rls_test"
 *   node scripts/diagnostic/inspect_view_definition.js meta_permission
 */

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL non défini.');
    process.exit(1);
  }
  if (!/pngie_rdc_rls_test/.test(dbUrl)) {
    console.error('❌ Prévu pour pngie_rdc_rls_test uniquement. Arrêt.');
    process.exit(1);
  }

  const viewName = process.argv[2] || 'meta_permission';

  const { Client } = require('pg');
  const client = new Client({ connectionString: dbUrl });

  console.log(`=== Définition de la vue "${viewName}" (lecture seule) ===\n`);

  try {
    await client.connect();

    // Confirme le type d'objet (vue simple, vue matérialisée, ou table)
    const kindRes = await client.query(
      `SELECT relkind FROM pg_class WHERE relname = $1 AND relnamespace = 'public'::regnamespace`,
      [viewName]
    );
    if (kindRes.rowCount === 0) {
      console.log(`❌ Objet "${viewName}" introuvable.`);
      return;
    }
    const kindMap = { r: 'table', v: 'vue', m: 'vue matérialisée' };
    console.log(`Type d'objet : ${kindMap[kindRes.rows[0].relkind] || kindRes.rows[0].relkind}\n`);

    // Définition SQL complète de la vue
    const defRes = await client.query(`SELECT pg_get_viewdef($1::regclass, true) AS def`, [viewName]);
    console.log('--- Définition SQL ---');
    console.log(defRes.rows[0].def);

    // Vérifie s'il existe des triggers INSTEAD OF (qui permettraient un
    // INSERT direct sur la vue malgré tout)
    const trigRes = await client.query(
      `SELECT tgname, tgtype FROM pg_trigger
       WHERE tgrelid = $1::regclass AND NOT tgisinternal`,
      [viewName]
    );
    console.log(`\n--- Triggers sur "${viewName}" (${trigRes.rowCount}) ---`);
    console.log(trigRes.rowCount ? JSON.stringify(trigRes.rows, null, 2) : '(aucun — confirme qu\'un INSERT direct est impossible)');

    console.log('\n=== Fin. Aucune modification apportée. ===');
  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();