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

  console.log("\n=== 1. person_role pour test-mi ===");
  const pr = await client.query(`
    SELECT pr.* FROM person_role pr
    JOIN personne p ON p.personne_id = pr.person_id
    WHERE p.email = 'test-mi@pngie.local'
  `);
  console.log(pr.rows);

  console.log("\n=== 2. Tous les rôles disponibles dans le système ===");
  const roles = await client.query(`SELECT role_id, code, libelle FROM role ORDER BY code`);
  console.log(roles.rows);

  console.log("\n=== 3. Rôles pour les 6 comptes de test ===");
  const all = await client.query(`
    SELECT p.email, r.code AS role_code
    FROM personne p
    LEFT JOIN person_role pr ON pr.person_id = p.personne_id
    LEFT JOIN role r ON r.role_id = pr.role_id
    WHERE p.email LIKE 'test-%@pngie.local'
    ORDER BY p.email
  `);
  console.log(all.rows);

  console.log("\n=== 4. Requête exacte utilisée au login pour peupler req.user.roles ===");
  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
