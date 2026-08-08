const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnvAdmin() {
  const envPath = path.join(__dirname, "..", ".env.admin.local");
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
  return env;
}

async function main() {
  const admin = loadEnvAdmin();
  const client = new Client({
    host: "localhost", port: 5432,
    user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
    database: "postgres",
  });
  await client.connect();

  console.log("--- Roles existants ---");
  const roles = await client.query("SELECT rolname, rolcanlogin FROM pg_roles WHERE rolname NOT LIKE 'pg_%' ORDER BY rolname");
  roles.rows.forEach(r => console.log(`  ${r.rolname} (login: ${r.rolcanlogin})`));

  console.log("\n--- Bases existantes ---");
  const dbs = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname");
  dbs.rows.forEach(d => console.log(`  ${d.datname}`));

  console.log("\n--- Question 4 : acte_officiel existe-t-il dans pngie_rdc ? ---");
  await client.end();

  for (const dbName of ["pngie_rdc", "pngie_rdc_rls_test"]) {
    const c = new Client({
      host: "localhost", port: 5432,
      user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
      database: dbName,
    });
    try {
      await c.connect();
      const r = await c.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'acte_officiel'");
      const nbTables = await c.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'");
      console.log(`  ${dbName} : acte_officiel present = ${r.rows[0].count > 0}, total tables = ${nbTables.rows[0].count}`);
      await c.end();
    } catch (e) {
      console.log(`  ${dbName} : ERREUR connexion (${e.message})`);
    }
  }
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
