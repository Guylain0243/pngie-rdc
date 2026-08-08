// scripts/verify-test-users.js
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
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

const TEST_ACCOUNTS = [
  "test-mi@pngie.local","test-pm@pngie.local","test-pr@pngie.local",
  "test-an@pngie.local","test-gv@pngie.local","test-sn@pngie.local",
];

async function main() {
  loadEnvTest();
  const password = process.env.PNGIE_TEST_PASSWORD;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    password: process.env.PGPASSWORD,
  });
  await client.connect();

  const res = await client.query(
    `SELECT email, password_hash FROM personne WHERE email = ANY($1)`,
    [TEST_ACCOUNTS]
  );

  console.log(`\n=== VÉRIFICATION (lecture seule, table: personne) ===`);
  for (const email of TEST_ACCOUNTS) {
    const row = res.rows.find(r => r.email === email);
    if (!row) {
      console.log(`X ${email} — INTROUVABLE en base`);
      continue;
    }
    const ok = await bcrypt.compare(password, row.password_hash);
    console.log(`${ok ? "OK" : "X"} ${email} — mot de passe ${ok ? "valide" : "INVALIDE"}`);
  }

  await client.end();
}

main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
