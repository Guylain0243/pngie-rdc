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

  console.log("=== A. Colonnes ===");
  for (const t of ["journal_audit_default", "journal_connexion"]) {
    const cols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [t]);
    console.log(`\n-- ${t} --`);
    cols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));
  }

  console.log("\n=== B. Foreign keys ===");
  const fks = await client.query(`
    SELECT tc.table_name AS depuis, kcu.column_name AS colonne, ccu.table_name AS vers_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('journal_audit_default','journal_connexion')
  `);
  if (fks.rows.length === 0) console.log("  (aucune FK trouvée)");
  fks.rows.forEach(r => console.log(`  ${r.depuis}.${r.colonne} -> ${r.vers_table}`));

  console.log("\n=== C. Tables %journal% ===");
  const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%journal%'`);
  tables.rows.forEach(r => console.log(`  ${r.table_name}`));

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
