const { Client } = require("pg");

async function main() {
  const client = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: process.argv[2],
    database: "pngie_rdc_rls_test",
  });
  await client.connect();

  // GARDE-FOU CRITIQUE
  const dbCheck = await client.query(`SELECT current_database(), current_user`);
  const dbName = dbCheck.rows[0].current_database;
  if (dbName !== "pngie_rdc_rls_test") {
    console.error(`ARRÊT : base connectée = "${dbName}", attendu "pngie_rdc_rls_test". Abandon.`);
    process.exit(1);
  }
  console.log("Connecté :", dbCheck.rows[0]);

  const NEW_QUAL = `((COALESCE(current_setting('app.bypass_rls'::text, true), 'false'::text) = 'true'::text) OR (scope_institution_id IS NOT DISTINCT FROM (NULLIF(current_setting('app.current_institution_id'::text, true), ''::text))::uuid))`;

  console.log("\n=== PATCH : remplacement de '=' par 'IS NOT DISTINCT FROM' ===");
  await client.query(`
    ALTER POLICY personne_role_scope_institution ON personne_role
    USING ${NEW_QUAL}
    WITH CHECK ${NEW_QUAL}
  `);
  console.log("Patch appliqué avec succès.\n");

  const verify = await client.query(`SELECT policyname, qual, with_check FROM pg_policies WHERE tablename = 'personne_role'`);
  console.log("=== POLICY APRÈS PATCH ===");
  console.log(JSON.stringify(verify.rows, null, 2));

  await client.end();
}
main().catch(e => { console.error("ERREUR FATALE :", e.message); process.exit(1); });
