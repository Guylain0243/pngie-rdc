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

  const tables = await client.query(`
    SELECT relname, relkind, CASE relkind WHEN 'r' THEN 'TABLE' WHEN 'v' THEN 'VUE' ELSE relkind::text END AS type
    FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r','v')
    ORDER BY relkind, relname
  `);
  console.log("=== TABLES ET VUES (public) ===");
  console.table(tables.rows);

  const rlsTables = await client.query(`
    SELECT relname, relrowsecurity FROM pg_class
    WHERE relnamespace = 'public'::regnamespace AND relkind = 'r' AND relrowsecurity = true
  `);
  console.log("\n=== TABLES AVEC RLS ACTIVÉ ===");
  console.table(rlsTables.rows);

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
