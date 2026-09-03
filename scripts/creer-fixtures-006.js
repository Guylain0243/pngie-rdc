// scripts/creer-fixtures-006.js
// Cree la fixture agent fixe attendue par tests/e2e/006_agents_rh.test.js.
// Idempotent (ON CONFLICT DO NOTHING).
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

const AGENT_ID = "6660d7d9-b855-4ca6-966a-4e622c8de64b";
const INSTITUTION_MIN0_ID = "1ed01a6a-2086-44f8-9659-c781242c9b97"; // MIN_0

async function main() {
  loadEnvTest();
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    password: process.env.PGPASSWORD,
  });
  await client.connect();
  await client.query(`SELECT set_config('app.bypass_rls', 'true', false)`);

  console.log("=== FIXTURE AGENT TEST 006 (bypass_rls actif) ===\n");

  await client.query(
    `INSERT INTO agent (agent_id, nom, prenom, date_naissance, matricule, sexe, institution_id, statut)
     VALUES ($1,'TestScope','Agent','1985-05-15','TESTSCOPE-006','M',$2,'ACTIF')
     ON CONFLICT (agent_id) DO NOTHING`,
    [AGENT_ID, INSTITUTION_MIN0_ID]
  );
  console.log("OK agent TestScope (MIN_0)");

  const check = await client.query(`SELECT agent_id, nom, matricule, institution_id FROM agent WHERE agent_id = $1`, [AGENT_ID]);
  console.log(check.rows);

  await client.end();
  console.log("\nTermine.");
}

main().catch(e => { console.error("ERREUR FATALE :", e.message); process.exit(1); });