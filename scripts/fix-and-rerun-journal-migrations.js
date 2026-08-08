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
const FICHIER_001 = path.join(MIGRATIONS_DIR, "001_create_journal_schema.sql");
const FICHIERS_SUITE = [
  "002_seed_type_acte.sql",
  "003_permissions_journal.sql",
  "004_rls_journal.sql",
  "005_triggers_journal.sql",
];

async function getPk(client, table) {
  const res = await client.query(`
    SELECT a.attname AS colonne, format_type(a.atttypid, a.atttypmod) AS type
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = $1::regclass AND i.indisprimary
  `, [table]);
  if (res.rows.length === 0) throw new Error(`Aucune clé primaire trouvée pour ${table}`);
  if (res.rows.length > 1) throw new Error(`Clé primaire composite sur ${table} — correction manuelle requise`);
  return { colonne: res.rows[0].colonne, type: res.rows[0].type.toUpperCase() };
}

async function main() {
  const admin = loadEnvAdmin();
  const client = new Client({
    host: "localhost", port: 5432,
    user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
    database: "pngie_rdc_rls_test",
  });
  await client.connect();

  // Sécurité : si acte_officiel existe déjà, la transaction précédente
  // n'a pas été proprement annulée — on arrête plutôt que de deviner.
  const dejaPresent = await client.query(`
    SELECT 1 FROM information_schema.tables WHERE table_name = 'acte_officiel'
  `);
  if (dejaPresent.rows.length > 0) {
    console.error("acte_officiel existe déjà en base — état incertain, arrêt volontaire.");
    console.error("Vérifier manuellement avant de relancer ce script.");
    await client.end();
    process.exit(1);
  }

  console.log("=== Détection des clés primaires réelles ===");
  const institution = await getPk(client, "institution");
  const document    = await getPk(client, "document");
  const personne    = await getPk(client, "personne");
  console.log(`  institution.${institution.colonne} (${institution.type})`);
  console.log(`  document.${document.colonne} (${document.type})`);
  console.log(`  personne.${personne.colonne} (${personne.type})`);

  console.log("\n=== Correction de 001_create_journal_schema.sql ===");
  let sql = fs.readFileSync(FICHIER_001, "utf8");
  fs.writeFileSync(FICHIER_001 + ".bak", sql, "utf8"); // sauvegarde avant réécriture

  const regexRef = /(\w+)\s+(INTEGER|UUID|BIGINT)(\s+NOT NULL)?\s+REFERENCES\s+(institution|document|personne)\(id\)/g;
  const pkParTable = { institution, document, personne };

  sql = sql.replace(regexRef, (match, colOrigine, typeOrigine, notNull, table) => {
    const pk = pkParTable[table];
    const nn = notNull || "";
    return `${colOrigine.padEnd(26)}${pk.type}${nn} REFERENCES ${table}(${pk.colonne})`;
  });

  fs.writeFileSync(FICHIER_001, sql, "utf8");
  console.log("Fichier corrigé (sauvegarde dans 001_create_journal_schema.sql.bak).");

  console.log("\n=== Exécution des migrations ===");
  const tousLesFichiers = [FICHIER_001, ...FICHIERS_SUITE.map(f => path.join(MIGRATIONS_DIR, f))];
  for (const chemin of tousLesFichiers) {
    const nom = path.basename(chemin);
    console.log(`\n--- ${nom} ---`);
    const contenu = fs.readFileSync(chemin, "utf8");
    try {
      await client.query(contenu);
      console.log(`OK : ${nom}`);
    } catch (e) {
      console.error(`ERREUR dans ${nom} : ${e.message}`);
      await client.end();
      process.exit(1);
    }
  }

  console.log("\nToutes les migrations Journal National ont été appliquées avec succès.");
  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
