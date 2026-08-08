const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function chargerEnv(nomFichier) {
  const p = path.join(__dirname, "..", nomFichier);
  if (!fs.existsSync(p)) return {};
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

async function testConnexion(label, user, password, database) {
  const c = new Client({ host: "localhost", port: 5432, user, password, database });
  try {
    await c.connect();
    console.log(`${label} : OK`);
    await c.end();
    return true;
  } catch (e) {
    console.log(`${label} : ECHEC (${e.code || ""} ${e.message})`);
    return false;
  }
}

async function main() {
  const admin = chargerEnv(".env.admin.local");
  const test = chargerEnv(".env.test");

  console.log("=== Variables trouvees dans .env.test (noms uniquement) ===");
  console.log(Object.keys(test).join(", ") || "(fichier absent ou vide)");

  console.log("\n=== Tests avec le mot de passe reel de .env.admin.local ===");
  await testConnexion("postgres / mdp .env.admin.local / pngie_rdc", admin.PGSUPERUSER, admin.PGSUPERUSER_PASSWORD, "pngie_rdc");
  await testConnexion("postgres / mdp .env.admin.local / pngie_rdc_rls_test", admin.PGSUPERUSER, admin.PGSUPERUSER_PASSWORD, "pngie_rdc_rls_test");

  const mdpAppCandidats = Object.entries(test).filter(([k]) => /PGAPP|APP_PASS|DB_PASS|PNGIE_APP/i.test(k));
  console.log("\n=== Candidats mot de passe pngie_app trouves dans .env.test ===");
  console.log(mdpAppCandidats.length ? mdpAppCandidats.map(([k]) => k).join(", ") : "(aucun trouve par ce filtre)");
  for (const [k, v] of mdpAppCandidats) {
    await testConnexion(`pngie_app / mdp de ${k} / pngie_rdc`, "pngie_app", v, "pngie_rdc");
    await testConnexion(`pngie_app / mdp de ${k} / pngie_rdc_rls_test`, "pngie_app", v, "pngie_rdc_rls_test");
  }
}
main();
