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

  console.log("=== SANS bypass_rls, SANS current_institution_id (= comportement réel de l'app au login) ===");
  const r1 = await client.query(`
    SELECT r.code FROM person_role pr
    JOIN role r ON r.role_id = pr.role_id
    WHERE pr.person_id = (SELECT personne_id FROM personne WHERE email = 'test-mi@pngie.local')
  `);
  console.log("Lignes visibles :", r1.rows);

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
