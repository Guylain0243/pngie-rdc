const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnvTest() {
  const envPath = path.join(__dirname, "..", ".env.test");
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    process.env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
}

async function main() {
  loadEnvTest();
  const client = new Client({ connectionString: process.env.DATABASE_URL, password: process.env.PGPASSWORD });
  await client.connect();

  console.log("=== Policies RLS actives sur personne_role ===");
  const pol = await client.query(`
    SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS using_expr, pg_get_expr(polwithcheck, polrelid) AS with_check_expr
    FROM pg_policy WHERE polrelid = 'personne_role'::regclass
  `);
  console.log(JSON.stringify(pol.rows, null, 2));

  console.log("\n=== RLS activé sur la table ? ===");
  const rls = await client.query(`SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'personne_role'`);
  console.log(rls.rows);

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
