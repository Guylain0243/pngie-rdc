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

async function main() {
  const admin = chargerEnv(".env.admin.local");
  const client = new Client({
    host: "localhost", port: 5432,
    user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
    database: "pngie_rdc_rls_test",
  });
  await client.connect();

  console.log("=== Roles de test-pm@pngie.local (sans filtre) ===");
  const roles = await client.query(`
    SELECT p.personne_id, r.code AS role_code, pr.scope_institution_id, pr.statut
    FROM personne p
    JOIN personne_role pr ON pr.personne_id = p.personne_id
    JOIN role r ON r.role_id = pr.role_id
    WHERE p.email = 'test-pm@pngie.local'
  `);
  console.log(roles.rows);

  console.log("\n=== Fallback : une institution existante quelconque, si scope national ===");
  const inst = await client.query(`SELECT institution_id, code, nom FROM institution LIMIT 1`);
  console.log(inst.rows[0]);

  const type = await client.query(`SELECT id FROM type_acte_ref WHERE code = 'COMMUNIQUE'`);

  await client.end();

  const scopeInstitution = roles.rows.find(r => r.scope_institution_id)?.scope_institution_id;
  const institutionId = scopeInstitution || inst.rows[0].institution_id;
  const typeActeId = type.rows[0].id;

  fs.writeFileSync(path.join(__dirname, "..", "scripts", "donnees-test-cycle.json"), JSON.stringify({ institutionId, typeActeId }));
  console.log("\nDonnees finales retenues :", { institutionId, typeActeId, "scope_pm_etait_null": !scopeInstitution });
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
