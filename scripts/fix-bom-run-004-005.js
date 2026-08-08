const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnvAdmin() {
  const envPath = path.join(__dirname, "..", ".env.admin.local");
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
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
  const admin = loadEnvAdmin();
  const client = new Client({
    host: "localhost", port: 5432,
    user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
    database: "pngie_rdc_rls_test",
  });
  await client.connect();

  const dir = path.join(__dirname, "..", "db", "migrations", "journal");

  for (const fichier of ["004_rls_journal.sql", "005_triggers_journal.sql"]) {
    const chemin = path.join(dir, fichier);
    let sql = fs.readFileSync(chemin, "utf8");
    const avaitBOM = sql.charCodeAt(0) === 0xFEFF;
    sql = retirerBOM(sql);
    if (avaitBOM) {
      fs.writeFileSync(chemin, sql, "utf8"); // Node écrit sans BOM par défaut
      console.log(`BOM retiré de ${fichier}.`);
    }

    try {
      await client.query(sql);
      console.log(`OK : ${fichier}`);
    } catch (e) {
      console.error(`ERREUR dans ${fichier} : ${e.message}`);
      await client.end();
      process.exit(1);
    }
  }

  console.log("\n=== Lot 1 (migrations Journal National) termine a 100% ===");
  await client.end();
}
main();
