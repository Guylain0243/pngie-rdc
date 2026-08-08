const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

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
  const client = new Client({
    host: "localhost", port: 5432,
    user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
    database: "pngie_rdc_rls_test",
  });
  await client.connect();

  console.log("=== La table 'person' (anglais) existe-t-elle dans pngie_rdc_rls_test ? ===");
  const existe = await client.query(`SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'person'`);
  console.log("person existe :", existe.rows[0].count > 0);

  if (existe.rows[0].count > 0) {
    const colonnes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'person' ORDER BY ordinal_position`);
    console.log("Colonnes de 'person' :", colonnes.rows.map(r => r.column_name).join(", "));

    const compte = await client.query(`SELECT COUNT(*) FROM person`);
    console.log("Nombre de lignes dans 'person' :", compte.rows[0].count);

    const recherche = await client.query(`SELECT email, statut FROM person WHERE email = $1`, ["test-an@pngie.local"]);
    console.log("test-an@pngie.local dans 'person' :", recherche.rows.length > 0 ? recherche.rows[0] : "INTROUVABLE");
  }

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
