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
  "003_permissions_journal.sql",
  "006_fix_rls_journal_scope_national.sql",
  "007_fix_trigger_audit_argument.sql",
  "008_retire_trigger_audit_historique.sql",
  "009_grant_mi_journal_creer.sql",
  "010_test_fixture_institution_mi.sql",
  "011_fix_rls_acte_officiel_insert_national.sql",
  "012_grant_pm_journal_creer.sql",
  "013_fix_role_lecture_nationale.sql",
  "014_seed_permissions_workflow_journal.sql",
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

