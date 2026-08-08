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
const FICHIER_004 = path.join(MIGRATIONS_DIR, "004_rls_journal.sql");
const FICHIER_005 = path.join(MIGRATIONS_DIR, "005_triggers_journal.sql");

async function main() {
  const admin = loadEnvAdmin();
  const client = new Client({
    host: "localhost", port: 5432,
    user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
    database: "pngie_rdc_rls_test",
  });
  await client.connect();

  console.log("=== Politiques RLS existantes (personne, personne_role, institution, document) ===");
  const pol = await client.query(`
    SELECT tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename IN ('personne','personne_role','institution','document')
    ORDER BY tablename, policyname
  `);
  pol.rows.forEach(r => {
    console.log(`\n[${r.tablename}] ${r.policyname} (${r.cmd})`);
    if (r.qual) console.log(`  USING      : ${r.qual}`);
    if (r.with_check) console.log(`  WITH CHECK : ${r.with_check}`);
  });

  // Extraction des appels de fonction contenant des mots-clés pertinents
  const texteComplet = pol.rows.map(r => `${r.qual || ""} ${r.with_check || ""}`).join(" ");
  const appels = texteComplet.match(/[a-zA-Z_][a-zA-Z0-9_.]*\([^()]*\)/g) || [];

  const compte = {};
  appels.forEach(a => { compte[a] = (compte[a] || 0) + 1; });

  const candidatsUser = Object.keys(compte).filter(a => /personne_id|current_user|current_setting/i.test(a));
  const candidatsScope = Object.keys(compte).filter(a => /scope|institution/i.test(a) && !/personne_id/i.test(a));
  const candidatsPerm = Object.keys(compte).filter(a => /has_permission|permission/i.test(a));

  console.log("\n=== Candidats détectés ===");
  console.log("Fonction utilisateur courant :", candidatsUser);
  console.log("Fonction de scope            :", candidatsScope);
  console.log("Fonction de permission       :", candidatsPerm);

  if (candidatsUser.length === 0) {
    console.log("\nAucune fonction utilisateur détectée automatiquement dans ces 4 tables.");
    console.log("Correction manuelle nécessaire à partir de la sortie ci-dessus — pas de reprise automatique.");
    await client.end();
    return;
  }

  // Prise du candidat le plus fréquent pour chaque catégorie
  const fnUser = candidatsUser.sort((a,b) => compte[b]-compte[a])[0].replace(/\([^()]*\)/, "()");
  const fnScope = candidatsScope.length ? candidatsScope.sort((a,b) => compte[b]-compte[a])[0] : null;
  const fnPerm = candidatsPerm.length ? candidatsPerm[0].split("(")[0] : "has_permission";

  console.log(`\nRetenu -> utilisateur: ${fnUser} | scope: ${fnScope || "(non détecté, inchangé)"} | permission: ${fnPerm}`);

  for (const fichier of [FICHIER_004, FICHIER_005]) {
    let contenu = fs.readFileSync(fichier, "utf8");
    fs.writeFileSync(fichier + ".bak", contenu, "utf8");
    contenu = contenu.split("app.current_personne_id()").join(fnUser);
    if (fnScope) {
      contenu = contenu.replace(/fn_scope_institutions\([^)]*\)/g, fnScope);
    }
    contenu = contenu.replace(/\bhas_permission\b/g, fnPerm);
    fs.writeFileSync(fichier, contenu, "utf8");
  }
  console.log("\n004 et 005 corrigés (sauvegardes .bak créées).");

  console.log("\n=== Reprise à partir de 004 ===");
  for (const fichier of [FICHIER_004, FICHIER_005]) {
    const nom = path.basename(fichier);
    console.log(`\n--- ${nom} ---`);
    const sql = fs.readFileSync(fichier, "utf8");
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
