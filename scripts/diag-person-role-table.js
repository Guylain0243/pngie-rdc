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

  console.log("=== 1. person_role est-elle une vue ? ===");
  const kind = await client.query(`
    SELECT relkind FROM pg_class WHERE relname = 'person_role' AND relnamespace = 'public'::regnamespace
  `);
  console.log(kind.rows);

  console.log("\n=== 2. Définition de la vue (pour trouver la vraie table) ===");
  const def = await client.query(`SELECT definition FROM pg_views WHERE viewname = 'person_role'`);
  console.log(def.rows[0]?.definition || "(pas une vue)");

  console.log("\n=== 3. Toutes les tables/vues avec une colonne role_id (candidates) ===");
  const cands = await client.query(`
    SELECT c.relname, c.relkind
    FROM pg_attribute a JOIN pg_class c ON a.attrelid = c.oid
    WHERE a.attname = 'role_id' AND c.relnamespace = 'public'::regnamespace
  `);
  console.log(cands.rows);

  console.log("\n=== 4. Droits de pngie_app sur les candidates ===");
  for (const row of cands.rows) {
    const g = await client.query(`
      SELECT privilege_type FROM information_schema.role_table_grants
      WHERE table_name = $1 AND grantee = 'pngie_app'
    `, [row.relname]);
    console.log(`${row.relname} (${row.relkind === 'v' ? 'vue' : 'table'}) :`, g.rows.map(r => r.privilege_type));
  }

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
