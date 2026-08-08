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
  // Connexion en tant que postgres (superuser), UNIQUEMENT pour ce diagnostic
  const client = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: process.env.PGPASSWORD,
    database: "pngie_rdc_rls_test",
  });
  await client.connect();

  const dbCheck = await client.query(`SELECT current_database(), current_user`);
  console.log("Connecté à :", dbCheck.rows[0]);

  const owner = await client.query(`
    SELECT tableowner FROM pg_tables WHERE tablename = 'personne_role'
  `);
  console.log("Propriétaire de personne_role :", owner.rows);

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
