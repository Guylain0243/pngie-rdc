const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnvTest() {
  const envPath = path.join(__dirname, "..", ".env.test");
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

async function main() {
  loadEnvTest();
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    password: process.env.PGPASSWORD,
  });
  await client.connect();

  console.log("\n=== 1. person est-elle une vue ou une table ? ===");
  const kind = await client.query(`
    SELECT relname, relkind,
      CASE relkind WHEN 'v' THEN 'VUE' WHEN 'r' THEN 'TABLE' ELSE relkind::text END AS type
    FROM pg_class WHERE relname = 'person' AND relnamespace = 'public'::regnamespace
  `);
  console.log(kind.rows);

  console.log("\n=== 2. Définition de la vue (pour trouver la vraie table) ===");
  const def = await client.query(`SELECT definition FROM pg_views WHERE viewname = 'person'`);
  console.log(def.rows[0]?.definition || "(pas une vue, ou introuvable)");

  console.log("\n=== 3. Droits actuels de pngie_app sur 'person' ===");
  const grants = await client.query(`
    SELECT grantee, privilege_type FROM information_schema.role_table_grants
    WHERE table_name = 'person' AND grantee = 'pngie_app'
  `);
  console.log(grants.rows);

  console.log("\n=== 4. Toutes les tables/vues candidates contenant password_hash ===");
  const cols = await client.query(`
    SELECT c.relname, c.relkind, a.attname
    FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    WHERE a.attname = 'password_hash' AND c.relnamespace = 'public'::regnamespace
  `);
  console.log(cols.rows);

  console.log("\n=== 5. Droits de pngie_app sur ces tables/vues ===");
  for (const row of cols.rows) {
    const g = await client.query(`
      SELECT privilege_type FROM information_schema.role_table_grants
      WHERE table_name = $1 AND grantee = 'pngie_app'
    `, [row.relname]);
    console.log(`${row.relname} (${row.relkind === 'v' ? 'vue' : 'table'}) :`, g.rows.map(r => r.privilege_type));
  }

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
