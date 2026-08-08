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
  const admin = chargerEnv(".env.admin.local");
  const test = chargerEnv(".env.test");

  const client = new Client({
    host: "localhost", port: 5432,
    user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
    database: "pngie_rdc_rls_test",
  });
  await client.connect();

  const email = "test-an@pngie.local";
  console.log(`=== Recherche de ${email} dans pngie_rdc_rls_test ===`);
  const p = await client.query(
    "SELECT personne_id, email, statut, password_hash, tentatives_echouees, verrouille_jusqu_a FROM personne WHERE email = $1",
    [email]
  );

  if (p.rows.length === 0) {
    console.log("COMPTE INTROUVABLE dans cette base.");
  } else {
    const row = p.rows[0];
    console.log("Compte trouve :", { personne_id: row.personne_id, statut: row.statut, tentatives_echouees: row.tentatives_echouees, verrouille_jusqu_a: row.verrouille_jusqu_a });

    console.log("\n=== Verification du mot de passe (PNGIE_TEST_PASSWORD de .env.test) ===");
    const motDePasseAttendu = test.PNGIE_TEST_PASSWORD;
    if (!motDePasseAttendu) {
      console.log("PNGIE_TEST_PASSWORD absent de .env.test !");
    } else {
      const correspond = await bcrypt.compare(motDePasseAttendu, row.password_hash);
      console.log("Le mot de passe de .env.test correspond au hash stocke :", correspond);
    }
  }

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
