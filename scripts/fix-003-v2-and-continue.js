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

  console.log("=== Rôles existants ===");
  const roles = await client.query(`SELECT * FROM role LIMIT 50`);
  console.log(roles.rows.map(r => JSON.stringify(r)).join("\n"));

  console.log("\n=== Exemples de lignes permission existantes (hors journal) ===");
  const exemples = await client.query(`SELECT * FROM permission LIMIT 8`);
  console.log(exemples.rows.map(r => JSON.stringify(r)).join("\n"));

  // Colonne d'identification du rôle dans 'role' (souvent 'code' ou 'nom')
  const roleColsRes = await client.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'role'
  `);
  const roleCols = roleColsRes.rows.map(r => r.column_name);
  const colRoleCode = ["code", "nom", "libelle"].find(c => roleCols.includes(c));
  const colRoleId = roleCols.includes("role_id") ? "role_id" : "id";

  if (!colRoleCode) {
    console.log("\nImpossible d'identifier automatiquement la colonne code/nom du rôle. Colonnes:", roleCols);
    await client.end();
    process.exit(1);
  }

  console.log(`\nColonne rôle utilisée pour le mapping : ${colRoleCode} / clé : ${colRoleId}`);

  // Mapping fonctionnel des actions journal par catégorie de rôle
  const actionsParCategorie = {
    central:  ["creer","modifier","valider","signer","publier","consulter","consulter.restreint","consulter.confidentiel","archiver","gerer_diffusion"],
    emetteur: ["creer","modifier","valider","consulter","consulter.restreint"],
    signataire: ["signer","consulter","consulter.restreint"],
    lecture:  ["consulter"],
  };

  // Détection heuristique par code de rôle — à ajuster si les codes réels diffèrent
  function categorie(codeRole) {
    const c = (codeRole || "").toUpperCase();
    if (["SN"].includes(c)) return "central";
    if (["PR"].includes(c)) return "signataire";
    if (["MI","PM","AN","GV"].includes(c)) return "emetteur";
    return "lecture";
  }

  const lignes = [];
  for (const row of roles.rows) {
    const codeRole = row[colRoleCode];
    const idRole = row[colRoleId];
    const cat = categorie(codeRole);
    for (const action of actionsParCategorie[cat]) {
      const code = `journal.${action}`;
      lignes.push(`  ('${idRole}', 'journal', '${action}', '${code}', 'actif')`);
    }
  }

  const sqlGenere = `-- ============================================================
-- 003_permissions_journal.sql (régénéré — structure réelle : permission(role_id, entite, action, code, statut))
-- Mapping appliqué : SN=complet, PR=signataire, MI/PM/AN/GV=émetteur, autres=lecture seule.
-- À AJUSTER si les codes de rôle réels (ci-dessus dans la sortie console) diffèrent de SN/PR/MI/PM/AN/GV.
-- ============================================================

BEGIN;

INSERT INTO permission (role_id, entite, action, code, statut) VALUES
${lignes.join(",\n")}
ON CONFLICT DO NOTHING;

COMMIT;
`;

  fs.writeFileSync(FICHIER_003 + ".bak2", fs.readFileSync(FICHIER_003, "utf8"), "utf8");
  fs.writeFileSync(FICHIER_003, sqlGenere, "utf8");
  console.log("\n003_permissions_journal.sql régénéré.");

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
