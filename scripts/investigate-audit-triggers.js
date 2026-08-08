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
    database: "pngie_rdc_rls_test",
  });
  await client.connect();

  console.log("=== Toutes les tables ayant un trigger appelant fn_audit_generique ===");
  const triggers = await client.query(`
    SELECT event_object_table, trigger_name
    FROM information_schema.triggers
    WHERE action_statement ILIKE '%fn_audit_generique%'
    ORDER BY event_object_table
  `);
  triggers.rows.forEach(r => console.log(`  ${r.event_object_table} -> ${r.trigger_name}`));
  console.log(`Total : ${triggers.rows.length} tables couvertes`);

  console.log("\n=== Définition complète de fn_audit_generique ===");
  const def = await client.query(`SELECT prosrc FROM pg_proc WHERE proname = 'fn_audit_generique'`);
  console.log(def.rows[0]?.prosrc || "(introuvable)");

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
