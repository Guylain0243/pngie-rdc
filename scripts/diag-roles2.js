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

  console.log("\n=== 1. Tous les rôles disponibles (table role) ===");
  const roles = await client.query(`SELECT role_id, code, nom, categorie FROM role ORDER BY code`);
  console.log(roles.rows);

  console.log("\n=== 2. Structure de person_role ===");
  const cols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'person_role' ORDER BY ordinal_position
  `);
  console.log(cols.rows);

  console.log("\n=== 3. État actuel des 6 comptes de test (rôle assigné ou non) ===");
  const state = await client.query(`
    SELECT p.email, p.personne_id, r.code AS role_code, r.nom AS role_nom
    FROM personne p
    LEFT JOIN person_role pr ON pr.person_id = p.personne_id
    LEFT JOIN role r ON r.role_id = pr.role_id
    WHERE p.email LIKE 'test-%@pngie.local'
    ORDER BY p.email
  `);
  console.log(state.rows);

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
