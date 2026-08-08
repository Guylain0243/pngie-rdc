const fs = require("fs");
const path = require("path");

function chargerEnv(nomFichier) {
  const p = path.join(__dirname, "..", nomFichier);
  const lines = fs.readFileSync(p, "utf8").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    const key = t.slice(0, idx).trim();
    const val = t.slice(idx + 1).trim();
    process.env[key] = val;
  }
}

chargerEnv(".env.development");

const bcrypt = require("bcrypt");
const db = require("../src/db"); // le VRAI module utilise par server.js

async function main() {
  console.log("Driver utilise par db.js :", db.driver);

  console.log("\n=== Meme appel EXACT que server.js (db.get, pas un Client brut) ===");
  const person = await db.get('SELECT * FROM person WHERE email = ? AND statut = ?', ["test-an@pngie.local", "ACTIF"]);
  console.log("Resultat db.get :", person ? `trouve (${person.email})` : "NULL");

  if (person) {
    const motDePasse = process.env.PNGIE_TEST_PASSWORD;
    console.log("PNGIE_TEST_PASSWORD present :", !!motDePasse);
    const ok = await bcrypt.compare(motDePasse || "", person.password_hash);
    console.log("bcrypt.compare :", ok);
  }

  await db.close();
}
main().catch(e => { console.error("ERREUR :", e.message, e.stack); process.exit(1); });
