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
    host: "localhost",
    port: 5432,
    user: admin.PGSUPERUSER,
    password: admin.PGSUPERUSER_PASSWORD,
    database: "pngie_rdc_rls_test",
  });
  await client.connect();

  for (const t of ["journal_audit_default", "journal_audit", "journal_connexion"]) {
    console.log(`\n=== ${t} ===`);

    const exists = await client.query(`SELECT to_regclass('public.${t}') AS reg`);
    if (!exists.rows[0].reg) { console.log("  N'existe pas."); continue; }

    const cols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = $1 ORDER BY ordinal_position
    `, [t]);
    console.log(`  Colonnes (${cols.rows.length}) :`);
    cols.rows.forEach(r => console.log(`    ${r.column_name} (${r.data_type})`));

    const count = await client.query(`SELECT COUNT(*)::int AS n FROM ${t}`);
    console.log(`  Lignes : ${count.rows[0].n}`);

    const grants = await client.query(`
      SELECT grantee, privilege_type FROM information_schema.role_table_grants
      WHERE table_name = $1
    `, [t]);
    console.log(`  GRANTs existants :`, grants.rows.length ? grants.rows : "(aucun)");
  }

  console.log("\n=== Code : toute référence litérale au nom de ces 3 tables ===");
  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
