// scripts/creer-roles-test.js
// Crée les 6 rôles nécessaires aux tests E2E dans la table role.
// Usage : node scripts/creer-roles-test.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
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

const ROLES = [
  { code: "PR", nom: "Présidence" },
  { code: "PM", nom: "Primature" },
  { code: "SN", nom: "Sénat" },
  { code: "AN", nom: "Assemblée Nationale" },
  { code: "MI", nom: "Ministères" },
  { code: "GV", nom: "Gouvernorat de Province" },
];

async function main() {
  loadEnvTest();
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    password: process.env.PGPASSWORD,
  });
  await client.connect();
  await client.query(`SELECT set_config('app.bypass_rls', 'true', false)`);

  console.log("=== CRÉATION DES RÔLES DE TEST (table: role) ===\n");

  for (const r of ROLES) {
    const existant = await client.query(`SELECT role_id FROM role WHERE code = $1`, [r.code]);
    if (existant.rowCount > 0) {
      console.log(`SKIP ${r.code} — existe déjà`);
      continue;
    }
    const roleId = crypto.randomUUID();
    await client.query(
      `INSERT INTO role (role_id, code, nom, statut, created_at)
       VALUES ($1, $2, $3, 'ACTIF', now())`,
      [roleId, r.code, r.nom]
    );
    console.log(`OK ${r.code} créé (role_id=${roleId})`);
  }

  await client.end();
  console.log("\nTerminé. Lancez ensuite : node scripts/assign-test-roles.js");
}

main().catch(e => { console.error("ERREUR FATALE :", e.message); process.exit(1); });