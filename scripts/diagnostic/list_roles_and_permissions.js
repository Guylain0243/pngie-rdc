/**
 * Sprint 4 (préparation) - Lecture seule : liste les rôles existants et un
 * échantillon de permissions déjà en place, pour préparer l'insertion des
 * permissions READ/WRITE sur ref_tribunal_paix (et les autres tables ref_*)
 * sans deviner des noms de rôle au hasard.
 *
 * ⚠️ LECTURE SEULE. Aucun INSERT, aucune modification.
 *
 * Usage :
 *   $env:DATABASE_URL = "postgresql://pngie_app@localhost:5432/pngie_rdc_rls_test"
 *   node scripts/diagnostic/list_roles_and_permissions.js
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

  const { Client } = require('pg');
  const client = new Client({ connectionString: dbUrl });

  console.log('=== Rôles et permissions existants (lecture seule) ===\n');

  try {
    await client.connect();

    // Rôles existants
    const rolesRes = await client.query(`SELECT * FROM role ORDER BY 1`);
    console.log(`--- Table "role" (${rolesRes.rowCount} ligne(s)) ---`);
    if (rolesRes.rowCount) {
      console.log(JSON.stringify(rolesRes.rows, null, 2));
    } else {
      console.log('(vide)');
    }

    // Codes de rôle distincts déjà utilisés dans meta_permission
    const roleCodesRes = await client.query(
      `SELECT DISTINCT role_code FROM meta_permission ORDER BY role_code`
    );
    console.log(`\n--- Codes de rôle déjà utilisés dans meta_permission (${roleCodesRes.rowCount}) ---`);
    console.log(roleCodesRes.rows.map(r => r.role_code).join(', ') || '(aucun)');

    // Échantillon de permissions existantes sur une entité "métier" connue
    // (certificat_pki), pour voir le format exact attendu.
    const sampleRes = await client.query(
      `SELECT * FROM meta_permission WHERE entity = 'certificat_pki' ORDER BY role_code, action`
    );
    console.log(`\n--- Exemple : permissions existantes sur "certificat_pki" (${sampleRes.rowCount}) ---`);
    console.log(JSON.stringify(sampleRes.rows, null, 2));

    // Vérifie s'il existe déjà quoi que ce soit pour ref_tribunal_paix ou
    // les autres tables ref_* (probablement rien, mais on vérifie).
    const refRes = await client.query(
      `SELECT * FROM meta_permission WHERE entity LIKE 'ref_%' ORDER BY entity, role_code, action`
    );
    console.log(`\n--- Permissions existantes sur des entités "ref_*" (${refRes.rowCount}) ---`);
    console.log(refRes.rowCount ? JSON.stringify(refRes.rows, null, 2) : '(aucune — confirmé, à créer)');

    console.log('\n=== Fin. Aucune modification apportée. ===');
  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();