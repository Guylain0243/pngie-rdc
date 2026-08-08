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

  console.log("=== Échantillon de journal_audit (5 lignes récentes) ===");
  const sample = await client.query(`SELECT entite, action, created_at FROM journal_audit ORDER BY created_at DESC LIMIT 5`);
  sample.rows.forEach(r => console.log(`  ${r.created_at.toISOString()} | ${r.entite} | ${r.action}`));

  console.log("\n=== Entités distinctes journalisées ===");
  const entites = await client.query(`SELECT DISTINCT entite FROM journal_audit`);
  entites.rows.forEach(r => console.log(`  ${r.entite}`));

  console.log("\n=== Triggers sur des tables appelant journal_audit ? ===");
  const triggers = await client.query(`
    SELECT event_object_table, trigger_name, action_statement
    FROM information_schema.triggers
    WHERE action_statement ILIKE '%journal_audit%'
  `);
  console.log(triggers.rows.length ? triggers.rows : "(aucun trigger trouvé)");

  console.log("\n=== Fonctions PL/pgSQL mentionnant journal_audit ===");
  const funcs = await client.query(`
    SELECT proname FROM pg_proc
    WHERE prosrc ILIKE '%journal_audit%'
  `);
  console.log(funcs.rows.length ? funcs.rows : "(aucune fonction trouvée)");

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
