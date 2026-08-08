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

  const res = await client.query(`SELECT * FROM pg_policies WHERE tablename = 'personne_role'`);

  const report = {
    date: new Date().toISOString(),
    database: process.env.DATABASE_URL,
    policies_before_patch: res.rows
  };

  fs.writeFileSync(
    path.join(__dirname, "..", "docs", "audits", "BUG_G_POLICY_BACKUP_AVANT_PATCH.json"),
    JSON.stringify(report, null, 2)
  );

  console.log("=== POLICY ACTUELLE (sauvegardée dans docs/audits/BUG_G_POLICY_BACKUP_AVANT_PATCH.json) ===");
  console.log(JSON.stringify(res.rows, null, 2));

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
