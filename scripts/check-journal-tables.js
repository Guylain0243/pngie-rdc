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

  for (const t of ["journal_audit_default", "journal_audit", "journal_connexion"]) {
    const exists = await client.query(`SELECT to_regclass('public.${t}') AS reg`);
    const count = exists.rows[0].reg ? await client.query(`SELECT COUNT(*)::int AS n FROM ${t}`) : { rows: [{ n: "N/A" }] };
    console.log(`${t} : existe=${!!exists.rows[0].reg} lignes=${count.rows[0].n}`);
  }

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
