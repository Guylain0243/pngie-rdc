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

  console.log("=== Politiques RLS existantes (personne, personne_role, institution, document) ===");
  const pol = await client.query(`
    SELECT tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename IN ('personne','personne_role','institution','document')
    ORDER BY tablename, policyname
  `);
  pol.rows.forEach(r => {
    console.log(`\n[${r.tablename}] ${r.policyname} (${r.cmd})`);
    if (r.qual) console.log(`  USING      : ${r.qual}`);
    if (r.with_check) console.log(`  WITH CHECK : ${r.with_check}`);
  });

  console.log("\n=== Fonctions RLS/RBAC existantes (schéma app ou public, nom évocateur) ===");
  const fns = await client.query(`
    SELECT n.nspname AS schema, p.proname AS fonction,
           pg_get_function_identity_arguments(p.oid) AS arguments
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname NOT IN ('pg_catalog','information_schema')
      AND (p.proname ILIKE '%personne_id%' OR p.proname ILIKE '%scope%'
           OR p.proname ILIKE '%permission%' OR p.proname ILIKE '%current_user%')
    ORDER BY n.nspname, p.proname
  `);
  fns.rows.forEach(r => console.log(`  ${r.schema}.${r.fonction}(${r.arguments})`));

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
