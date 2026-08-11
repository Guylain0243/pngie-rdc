// scripts/creer-permissions-test.js
// Crée la permission READ sur decision_gouvernementale pour les 6 rôles de test.
// Usage : node scripts/creer-permissions-test.js
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

const ROLE_CODES = ["PR", "PM", "SN", "AN", "MI", "GV"];
const ENTITE = "decision_gouvernementale";
const ACTION = "READ";

async function main() {
  loadEnvTest();
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    password: process.env.PGPASSWORD,
  });
  await client.connect();
  await client.query(`SELECT set_config('app.bypass_rls', 'true', false)`);

  console.log(`=== CRÉATION DES PERMISSIONS ${ENTITE}:${ACTION} (table: permission) ===\n`);

  for (const code of ROLE_CODES) {
    const role = await client.query(`SELECT role_id FROM role WHERE code = $1`, [code]);
    if (role.rowCount === 0) {
      console.warn(`SKIP ${code} — rôle introuvable`);
      continue;
    }
    const roleId = role.rows[0].role_id;

    const existant = await client.query(
      `SELECT permission_id FROM permission WHERE role_id = $1 AND entite = $2 AND action = $3`,
      [roleId, ENTITE, ACTION]
    );
    if (existant.rowCount > 0) {
      console.log(`SKIP ${code} — permission déjà présente`);
      continue;
    }

    const permissionId = crypto.randomUUID();
    await client.query(
      `INSERT INTO permission (permission_id, role_id, entite, action, condition_json, statut, created_at)
       VALUES ($1, $2, $3, $4, NULL, 'ACTIF', now())`,
      [permissionId, roleId, ENTITE, ACTION]
    );
    console.log(`OK ${code} -> permission ${ENTITE}:${ACTION} créée`);
  }

  await client.end();
  console.log("\nTerminé.");
}

main().catch(e => { console.error("ERREUR FATALE :", e.message); process.exit(1); });