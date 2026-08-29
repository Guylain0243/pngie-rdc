const {Client} = require('pg');
const c = new Client({connectionString: 'postgresql://pngie_app:' + encodeURIComponent(':NI=CcM#D.jL(i#ni1v&[^qU') + '@localhost:5432/pngie_rdc'});

async function run() {
  await c.connect();

  console.log("=== 1. security_invoker sur les 7 vues ===");
  const vues = await c.query(`
    SELECT relname, reloptions
    FROM pg_class
    WHERE relname IN ('person','person_role','organization','permission_compat','role_permission','meta_permission','rnso_hierarchie')
    AND relkind = 'v'
    ORDER BY relname
  `);
  console.log(JSON.stringify(vues.rows, null, 2));

  console.log("=== 2. Nombre de tables avec GRANT pour pngie_app ===");
  const grants = await c.query(`
    SELECT COUNT(DISTINCT table_name) AS nb_tables_avec_grant
    FROM information_schema.role_table_grants
    WHERE grantee = 'pngie_app'
  `);
  console.log(JSON.stringify(grants.rows, null, 2));

  console.log("=== 3. Test empirique : requete sur personne_role sans institution_id ===");
  await c.query("SET app.current_institution_id = ''");
  const test = await c.query("SELECT COUNT(*) FROM personne_role WHERE scope_institution_id IS NULL");
  console.log(JSON.stringify(test.rows, null, 2));

  await c.end();
}

run().catch(e => { console.error('ERREUR:', e.message); c.end(); });
