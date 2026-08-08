// scripts/reset-test-users.js
// Réinitialise le mot de passe des 6 comptes de test UNIQUEMENT.
// Cible la vraie table "personne" (la vue "person" est en lecture seule).
// Usage : node scripts/reset-test-users.js

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { Client } = require("pg");

function loadEnvTest() {
  const envPath = path.join(__dirname, "..", ".env.test");
  if (!fs.existsSync(envPath)) {
    console.error("ERREUR : fichier .env.test introuvable à la racine du projet.");
    process.exit(1);
  }
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
  "test-mi@pngie.local",
  "test-pm@pngie.local",
  "test-pr@pngie.local",
  "test-an@pngie.local",
  "test-gv@pngie.local",
  "test-sn@pngie.local",
];

async function main() {
  loadEnvTest();

  const password = process.env.PNGIE_TEST_PASSWORD;
  if (!password) {
    console.error("ERREUR : PNGIE_TEST_PASSWORD absent de .env.test");
    process.exit(1);
  }

  const invalid = TEST_ACCOUNTS.filter(e => !/^test-[a-z]+@pngie\.local$/.test(e));
  if (invalid.length > 0) {
    console.error("ERREUR : liste de comptes de test invalide, abandon.", invalid);
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    password: process.env.PGPASSWORD,
  });
  await client.connect();

  const hash = await bcrypt.hash(password, 10);

  const result = await client.query(
    `UPDATE personne SET password_hash = $1 WHERE email = ANY($2) RETURNING email`,
    [hash, TEST_ACCOUNTS]
  );

  console.log(`\n=== RAPPORT ===`);
  console.log(`Table ciblée      : personne`);
  console.log(`Comptes ciblés    : ${TEST_ACCOUNTS.length}`);
  console.log(`Comptes mis à jour: ${result.rowCount}`);
  console.log(`Emails mis à jour :`, result.rows.map(r => r.email));

  if (result.rowCount !== TEST_ACCOUNTS.length) {
    const found = result.rows.map(r => r.email);
    const missing = TEST_ACCOUNTS.filter(e => !found.includes(e));
    console.warn(`\nATTENTION : ${missing.length} compte(s) introuvable(s) en base :`, missing);
  } else {
    console.log(`\nOK — les 6 comptes de test ont bien le mot de passe : ${password}`);
  }

  await client.end();
}

main().catch(e => { console.error("ERREUR FATALE :", e.message); process.exit(1); });
