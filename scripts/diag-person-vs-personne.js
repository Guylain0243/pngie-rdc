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

  console.log("=== 'person' est-elle une vraie table ou une vue ? ===");
  const typeRelation = await client.query(`
    SELECT relkind FROM pg_class WHERE relname = 'person'
  `);
  const kind = typeRelation.rows[0]?.relkind;
  console.log("relkind :", kind, kind === 'v' ? "(VUE)" : kind === 'r' ? "(TABLE)" : "(autre)");

  console.log("\n=== Comparaison du password_hash : person vs personne ===");
  const pPerson = await client.query(`SELECT password_hash FROM person WHERE email = $1`, ["test-an@pngie.local"]);
  const pPersonne = await client.query(`SELECT password_hash FROM personne WHERE email = $1`, ["test-an@pngie.local"]);
  console.log("Hash identique entre les deux tables :", pPerson.rows[0]?.password_hash === pPersonne.rows[0]?.password_hash);

  const motDePasse = test.PNGIE_TEST_PASSWORD;
  const correspondPerson = await bcrypt.compare(motDePasse, pPerson.rows[0]?.password_hash || "");
  console.log("PNGIE_TEST_PASSWORD correspond au hash de 'person' :", correspondPerson);

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
