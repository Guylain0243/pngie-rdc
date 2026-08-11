// scripts/creer-comptes-test.js
// Crée les 6 comptes de test (table personne) avec le mot de passe PNGIE_TEST_PASSWORD.
// Usage : node scripts/creer-comptes-test.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
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

const COMPTES = [
  { email: "test-mi@pngie.local", nom: "Test MI", roleCode: "MI" },
  { email: "test-pm@pngie.local", nom: "Test PM", roleCode: "PM" },
  { email: "test-pr@pngie.local", nom: "Test PR", roleCode: "PR" },
  { email: "test-an@pngie.local", nom: "Test AN", roleCode: "AN" },
  { email: "test-gv@pngie.local", nom: "Test GV", roleCode: "GV" },
  { email: "test-sn@pngie.local", nom: "Test SN", roleCode: "SN" },
];

async function main() {
  loadEnvTest();
  const password = process.env.PNGIE_TEST_PASSWORD;
  if (!password) {
    console.error("ERREUR : PNGIE_TEST_PASSWORD absent de .env.test");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    password: process.env.PGPASSWORD,
  });
  await client.connect();
  await client.query(`SELECT set_config('app.bypass_rls', 'true', false)`);

  const hash = await bcrypt.hash(password, 10);

  console.log("=== CRÉATION DES COMPTES DE TEST (table: personne) ===\n");

  for (const c of COMPTES) {
    const existant = await client.query(`SELECT personne_id FROM personne WHERE email = $1`, [c.email]);
    if (existant.rowCount > 0) {
      console.log(`SKIP ${c.email} — existe déjà`);
      continue;
    }
    const personneId = crypto.randomUUID();
    await client.query(
      `INSERT INTO personne (personne_id, matricule, nom, prenom, email, password_hash, statut, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIF', now(), now())`,
      [personneId, "TEST-" + c.roleCode, c.nom, "Test", c.email, hash]
    );
    console.log(`OK ${c.email} créé (personne_id=${personneId})`);
  }

  await client.end();
  console.log("\nTerminé. Lancez ensuite : node scripts/assign-test-roles.js");
}

main().catch(e => { console.error("ERREUR FATALE :", e.message); process.exit(1); });