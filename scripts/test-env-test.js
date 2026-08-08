const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function chargerEnv(nomFichier) {
  const p = path.join(__dirname, "..", nomFichier);
  if (!fs.existsSync(p)) return {};
  const lines = fs.readFileSync(p, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
  return env;
}

async function testConnexion(label, user, password, database) {
  const c = new Client({ host: "localhost", port: 5432, user, password, database });
  try {
    await c.connect();
    console.log(`${label} : OK`);
    await c.end();
    return true;
  } catch (e) {
    console.log(`${label} : ECHEC (${e.code || ""} ${e.message})`);
    return false;
  }
}

async function main() {
  const test = chargerEnv(".env.test");

  console.log("=== DATABASE_URL de .env.test (mot de passe masque) ===");
  console.log((test.DATABASE_URL || "(absent)").replace(/:[^:@]+@/, ":****@"));

  console.log("\n=== Test direct via ce DATABASE_URL ===");
  if (test.DATABASE_URL) {
    const c = new Client({ connectionString: test.DATABASE_URL });
    try {
      await c.connect();
      const r = await c.query("SELECT current_user, current_database()");
      console.log("OK :", r.rows[0]);
      await c.end();
    } catch (e) {
      console.log("ECHEC :", e.code || "", e.message);
    }
  }

  console.log("\n=== Test PGPASSWORD de .env.test avec pngie_app, sur les deux bases ===");
  if (test.PGPASSWORD) {
    await testConnexion("pngie_app / PGPASSWORD de .env.test / pngie_rdc", "pngie_app", test.PGPASSWORD, "pngie_rdc");
    await testConnexion("pngie_app / PGPASSWORD de .env.test / pngie_rdc_rls_test", "pngie_app", test.PGPASSWORD, "pngie_rdc_rls_test");
    await testConnexion("postgres / PGPASSWORD de .env.test / pngie_rdc", "postgres", test.PGPASSWORD, "pngie_rdc");
  }
}
main();
