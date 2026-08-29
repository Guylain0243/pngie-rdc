const {Client} = require('pg');
const c = new Client({connectionString: 'postgresql://pngie_app:' + encodeURIComponent(':NI=CcM#D.jL(i#ni1v&[^qU') + '@localhost:5432/pngie_rdc'});

async function run() {
  await c.connect();
  console.log("=== VERIFICATION RLS-003 — Etat reel de pngie_rdc ===");
  console.log("Date: " + new Date().toISOString());
  console.log("");

  console.log("--- 1. Policy Bug G sur personne_role ---");
  const policy = await c.query("SELECT policyname, qual FROM pg_policies WHERE tablename='personne_role'");
  console.log(JSON.stringify(policy.rows, null, 2));
  console.log("");

  console.log("--- 2. security_invoker sur les 7 vues de compatibilite ---");
  const vues = await c.query(`
    SELECT relname, reloptions
    FROM pg_class
    WHERE relname IN ('person','person_role','organization','permission_compat','role_permission','meta_permission','rnso_hierarchie')
    AND relkind = 'v'
    ORDER BY relname
  `);
  console.log(JSON.stringify(vues.rows, null, 2));
  console.log("");

  console.log("--- 3. Nombre de tables avec GRANT pour pngie_app ---");
  const grants = await c.query(`
    SELECT COUNT(DISTINCT table_name) AS nb_tables_avec_grant
    FROM information_schema.role_table_grants
    WHERE grantee = 'pngie_app'
  `);
  console.log(JSON.stringify(grants.rows, null, 2));
  console.log("");

  console.log("--- 4. Detail des privileges (echantillon 5 tables) ---");
  const detail = await c.query(`
    SELECT table_name, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
    FROM information_schema.role_table_grants
    WHERE grantee = 'pngie_app' AND table_name IN ('personne_role','journal_audit','document','institution','accord_cooperation')
    GROUP BY table_name
    ORDER BY table_name
  `);
  console.log(JSON.stringify(detail.rows, null, 2));
  console.log("");

  console.log("--- 5. Test empirique : personne_role sans institution_id positionne ---");
  await c.query("SET app.current_institution_id = ''");
  const test = await c.query("SELECT COUNT(*) FROM personne_role WHERE scope_institution_id IS NULL");
  console.log(JSON.stringify(test.rows, null, 2));
  console.log("");

  console.log("=== FIN VERIFICATION ===");
  await c.end();
}

run().catch(e => { console.error('ERREUR:', e.message); c.end(); });
