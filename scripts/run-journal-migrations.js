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

const MIGRATIONS_DIR = path.join(__dirname, "..", "db", "migrations", "journal");
const FICHIERS = [
  "001_create_journal_schema.sql",
  "002_seed_type_acte.sql",
  "003_permissions_journal.sql",
  "004_rls_journal.sql",
  "005_triggers_journal.sql",
];

async function main() {
  const admin = loadEnvAdmin();
  const client = new Client({
    host: "localhost", port: 5432,
    user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
    database: "pngie_rdc_rls_test",
  });
  await client.connect();

  for (const fichier of FICHIERS) {
    const chemin = path.join(MIGRATIONS_DIR, fichier);
    console.log(`\n=== Exécution : ${fichier} ===`);
    const sql = fs.readFileSync(chemin, "utf8");
    try {
      await client.query(sql);
      console.log(`OK : ${fichier}`);
    } catch (e) {
      console.error(`ERREUR dans ${fichier} : ${e.message}`);
      console.error("Arrêt de la migration — corriger le fichier avant de relancer.");
      await client.end();
      process.exit(1);
    }
  }

  console.log("\nToutes les migrations Journal National ont été appliquées avec succès.");
  await client.end();
}

main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
