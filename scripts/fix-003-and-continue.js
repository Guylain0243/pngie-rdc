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
const FICHIER_003 = path.join(MIGRATIONS_DIR, "003_permissions_journal.sql");
const FICHIERS_A_REJOUER = ["003_permissions_journal.sql", "004_rls_journal.sql", "005_triggers_journal.sql"];

async function main() {
  const admin = loadEnvAdmin();
  const client = new Client({
    host: "localhost", port: 5432,
    user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
    database: "pngie_rdc_rls_test",
  });
  await client.connect();

  console.log("=== Structure réelle de la table permission ===");
  const cols = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'permission'
    ORDER BY ordinal_position
  `);
  if (cols.rows.length === 0) throw new Error("Table 'permission' introuvable — nom réel différent, à confirmer.");
  cols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

  const nomsColonnes = cols.rows.map(r => r.column_name);
  const colCode = nomsColonnes.includes("code") ? "code" : null;
  if (!colCode) throw new Error("Aucune colonne 'code' trouvée sur permission — correction manuelle requise.");

  // Colonne libellé : on cherche la variante réelle
  const colLibelle = ["libelle", "libelle_fr", "nom", "description", "label"].find(c => nomsColonnes.includes(c));
  const colModule = ["module", "domaine", "categorie"].find(c => nomsColonnes.includes(c));

  if (!colLibelle) {
    console.log("\nAucune colonne de libellé reconnue automatiquement. Colonnes disponibles listées ci-dessus.");
    throw new Error("Correction manuelle de 003 nécessaire — indiquez la colonne à utiliser pour le libellé.");
  }

  console.log(`\nColonnes retenues : code -> ${colCode}, libellé -> ${colLibelle}, module -> ${colModule || "(absente, ignorée)"}`);

  console.log("\n=== Correction de 003_permissions_journal.sql ===");
  const permissions = [
    ["journal.creer", "Créer un acte (brouillon)"],
    ["journal.modifier", "Modifier un acte non publié"],
    ["journal.valider", "Valider / rejeter un acte"],
    ["journal.signer", "Signer électroniquement un acte"],
    ["journal.publier", "Publier un acte"],
    ["journal.consulter", "Consulter les actes publics"],
    ["journal.consulter.restreint", "Consulter les actes en diffusion restreinte"],
    ["journal.consulter.confidentiel", "Consulter les actes en diffusion confidentielle"],
    ["journal.archiver", "Archiver un acte publié"],
    ["journal.gerer_diffusion", "Modifier le niveau de diffusion d'un acte"],
  ];

  const colonnesInsert = [colCode, colLibelle, ...(colModule ? [colModule] : [])];
  const valeursSql = permissions.map(([code, libelle]) => {
    const valeurs = [`'${code}'`, `'${libelle.replace(/'/g, "''")}'`, ...(colModule ? [`'journal'`] : [])];
    return `  (${valeurs.join(", ")})`;
  }).join(",\n");

  const nouveauContenu = `-- ============================================================
-- 003_permissions_journal.sql (corrigé automatiquement — structure réelle de 'permission')
-- ============================================================

BEGIN;

INSERT INTO permission (${colonnesInsert.join(", ")}) VALUES
${valeursSql}
ON CONFLICT (${colCode}) DO NOTHING;

COMMIT;
`;

  fs.writeFileSync(FICHIER_003 + ".bak", fs.readFileSync(FICHIER_003, "utf8"), "utf8");
  fs.writeFileSync(FICHIER_003, nouveauContenu, "utf8");
  console.log("Fichier 003 corrigé (sauvegarde dans 003_permissions_journal.sql.bak).");

  console.log("\n=== Reprise des migrations à partir de 003 ===");
  for (const nom of FICHIERS_A_REJOUER) {
    const chemin = path.join(MIGRATIONS_DIR, nom);
    console.log(`\n--- ${nom} ---`);
    const sql = fs.readFileSync(chemin, "utf8");
    try {
      await client.query(sql);
      console.log(`OK : ${nom}`);
    } catch (e) {
      console.error(`ERREUR dans ${nom} : ${e.message}`);
      await client.end();
      process.exit(1);
    }
  }

  console.log("\nLot 1 terminé : les 5 migrations Journal National sont appliquées.");
  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
