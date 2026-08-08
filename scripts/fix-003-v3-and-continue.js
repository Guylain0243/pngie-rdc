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

  const roles = await client.query(`SELECT role_id, code FROM role`);

  const actionsParCategorie = {
    central:    ["creer","modifier","valider","signer","publier","consulter","consulter.restreint","consulter.confidentiel","archiver","gerer_diffusion"],
    emetteur_signataire: ["creer","modifier","valider","consulter","consulter.restreint","signer"],
    emetteur:   ["creer","modifier","valider","consulter","consulter.restreint"],
  };

  function categorie(code) {
    if (code === "PM") return "central";
    if (code === "PR") return "emetteur_signataire";
    return "emetteur"; // SN, AN, MI, GV
  }

  const lignes = [];
  for (const row of roles.rows) {
    for (const action of actionsParCategorie[categorie(row.code)]) {
      lignes.push(`  ('${row.role_id}', 'journal', '${action}', 'actif')`);
    }
  }

  const sqlGenere = `-- ============================================================
-- 003_permissions_journal.sql (v3 — 'code' est une colonne générée, exclue de l'INSERT)
-- Mapping : PM=central (dont publier/archiver/gerer_diffusion), PR=émetteur+signataire,
-- SN/AN/MI/GV=émetteur (creer/modifier/valider/consulter/consulter.restreint).
-- Décision à confirmer institutionnellement — cf. message d'accompagnement.
-- ============================================================

BEGIN;

INSERT INTO permission (role_id, entite, action, statut) VALUES
${lignes.join(",\n")}
ON CONFLICT (role_id, entite, action) DO NOTHING;

COMMIT;
`;

  fs.writeFileSync(FICHIER_003 + ".bak3", fs.readFileSync(FICHIER_003, "utf8"), "utf8");
  fs.writeFileSync(FICHIER_003, sqlGenere, "utf8");
  console.log("003_permissions_journal.sql régénéré (v3).");

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
