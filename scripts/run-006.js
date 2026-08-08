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

function retirerBOM(texte) {
  return texte.charCodeAt(0) === 0xFEFF ? texte.slice(1) : texte;
}

async function main() {
  const admin = chargerEnv(".env.admin.local");
  const client = new Client({
    host: "localhost", port: 5432,
    user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
    database: "pngie_rdc_rls_test",
  });
  await client.connect();

  const chemin = path.join(__dirname, "..", "db", "migrations", "journal", "006_fix_rls_journal_scope_national.sql");
  let sql = fs.readFileSync(chemin, "utf8");
  if (sql.charCodeAt(0) === 0xFEFF) {
    sql = retirerBOM(sql);
    fs.writeFileSync(chemin, sql, "utf8");
    console.log("BOM retire du fichier 006.");
  }

  await client.query(sql);
  console.log("OK : 006 appliquee.");
  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
