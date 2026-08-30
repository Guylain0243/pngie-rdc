/**
 * Diagnostic : pourquoi /api/ministeres renvoie [] malgré 42 ministères
 * connus en base (Sprint 2).
 *
 * ⚠️ LECTURE SEULE.
 *
 * Usage :
 *   $env:DATABASE_URL = "postgresql://pngie_app@localhost:5432/pngie_rdc_rls_test"
 *   node scripts/diagnostic/diag_ministeres_vide.js
 */

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL non défini.');
    process.exit(1);
  }
  if (!/pngie_rdc_rls_test/.test(dbUrl)) {
    console.error('❌ Prévu pour pngie_rdc_rls_test uniquement.');
    process.exit(1);
  }

  const { Client } = require('pg');
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();

    console.log('--- organization_type (toutes les lignes) ---');
    const types = await client.query('SELECT id, code, libelle FROM organization_type ORDER BY code');
    console.log(JSON.stringify(types.rows, null, 2));

    console.log('\n--- Comptage organization par type_id (regroupé) ---');
    const parType = await client.query(`
      SELECT ot.code, ot.libelle, COUNT(o.*) AS nb
      FROM organization_type ot
      LEFT JOIN organization o ON o.type_id = ot.id
      GROUP BY ot.code, ot.libelle
      ORDER BY ot.code
    `);
    console.log(JSON.stringify(parType.rows, null, 2));

    console.log('\n--- Requête EXACTE de server.js (/api/ministeres) ---');
    const exact = await client.query(`
      SELECT o.nom, ot.libelle AS type, o.description
      FROM organization o JOIN organization_type ot ON ot.id = o.type_id
      WHERE ot.code = 'MINISTERE' ORDER BY o.nom
    `);
    console.log(`Nombre de lignes : ${exact.rowCount}`);
    console.log(JSON.stringify(exact.rows.slice(0, 5), null, 2));

    console.log('\n--- Total organization (sans filtre) ---');
    const total = await client.query('SELECT COUNT(*) AS n FROM organization');
    console.log(total.rows[0]);

    console.log('\n=== Fin. Aucune modification apportée. ===');
  } catch (err) {
    console.error('❌ Erreur :', err.message);
  } finally {
    await client.end();
  }
}

main();