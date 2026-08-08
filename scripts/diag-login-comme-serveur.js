const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const bcrypt = require("bcrypt");

function chargerEnv(nomFichier) {
  const p = path.join(__dirname, "..", nomFichier);
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

async function main() {
  const test = chargerEnv(".env.test");
  const client = new Client({ connectionString: test.DATABASE_URL });
  await client.connect();

  console.log("=== Requete EXACTE de la route de login, avec pngie_app ===");
  try {
    const r = await client.query(
      "SELECT * FROM person WHERE email = $1 AND statut = $2",
      ["test-an@pngie.local", "ACTIF"]
    );
    console.log("Nombre de lignes retournees :", r.rows.length);
    if (r.rows.length > 0) {
      console.log("Colonnes retournees :", Object.keys(r.rows[0]).join(", "));
      const motDePasse = test.PNGIE_TEST_PASSWORD;
      const ok = await bcrypt.compare(motDePasse, r.rows[0].password_hash);
      console.log("bcrypt.compare avec ce hash :", ok);
    }
  } catch (e) {
    console.log("ERREUR SQL :", e.code, e.message);
  }

  await client.end();
}
main().catch(e => { console.error("ERREUR FATALE :", e.message); process.exit(1); });
