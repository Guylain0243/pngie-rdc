// scripts/assign-test-roles.js
// Assigne à chaque compte de test le rôle correspondant à son suffixe d'email.
// Utilise app.bypass_rls (mécanisme prévu par la policy elle-même) pour l'écriture admin.
// Usage : node scripts/assign-test-roles.js
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
function loadEnvTest() {
  const envPath = path.join(__dirname, "..", ".env.test");
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    process.env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
}
const MAPPING = {
  "test-mi@pngie.local": "MI",
  "test-pm@pngie.local": "PM",
  "test-pr@pngie.local": "PR",
  "test-an@pngie.local": "AN",
  "test-gv@pngie.local": "GV",
  "test-sn@pngie.local": "SN",
};
// Résolu dynamiquement au runtime (voir plus bas) car les institution_id
// sont régénérés à chaque reseed (uuid_generate_v4()) : coder l'UUID en
// dur casse au premier reseed. MI -> code MIN_0 ("Intérieur, Sécurité,
// Décentralisation et Affaires coutumières"), stable dans les seeds.
// PM -> PRIMATURE, AN -> AN (Assemblée Nationale), SN -> SENAT, GV -> PROV_0
// (Kinshasa) : codes confirmes le 02/09/2026 par lecture directe de la table
// institution (bypass_rls) + convention deja etablie dans plusieurs scripts
// archives de sessions precedentes (archive/sessions/2026-08-14/*).
const SCOPE_INSTITUTION_CODES = {
  MI: "MIN_0",
  PM: "PRIMATURE",
  AN: "AN",
  SN: "SENAT",
  GV: "PROV_0",
};
async function main() {
  loadEnvTest();
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    password: process.env.PGPASSWORD,
  });
  await client.connect();
  const emails = Object.keys(MAPPING);
  const invalid = emails.filter(e => !/^test-[a-z]+@pngie\.local$/.test(e));
  if (invalid.length > 0) {
    console.error("ERREUR : mapping invalide, abandon.", invalid);
    process.exit(1);
  }
  // Active le bypass RLS pour CETTE SESSION uniquement (mécanisme prévu par la policy)
  await client.query(`SELECT set_config('app.bypass_rls', 'true', false)`);
  // Résoudre les institution_id réels à partir des codes stables
  const SCOPE_INSTITUTION = {};
  for (const [roleCode, instCode] of Object.entries(SCOPE_INSTITUTION_CODES)) {
    const inst = await client.query(`SELECT institution_id FROM institution WHERE code = $1`, [instCode]);
    if (inst.rowCount === 0) {
      console.error(`ERREUR : institution ${instCode} introuvable en base.`);
      process.exit(1);
    }
    SCOPE_INSTITUTION[roleCode] = inst.rows[0].institution_id;
  }
  console.log("=== ASSIGNATION DES RÔLES DE TEST (table: personne_role, bypass_rls actif) ===\n");
  for (const [email, roleCode] of Object.entries(MAPPING)) {
    const person = await client.query(`SELECT personne_id FROM personne WHERE email = $1`, [email]);
    if (person.rowCount === 0) {
      console.warn(`SKIP ${email} — compte introuvable en base`);
      continue;
    }
    const personId = person.rows[0].personne_id;
    const role = await client.query(`SELECT role_id FROM role WHERE code = $1`, [roleCode]);
    if (role.rowCount === 0) {
      console.warn(`SKIP ${email} — rôle ${roleCode} introuvable`);
      continue;
    }
    const roleId = role.rows[0].role_id;
    await client.query(`DELETE FROM personne_role WHERE personne_id = $1`, [personId]);
    await client.query(
      `INSERT INTO personne_role (personne_id, role_id, scope_institution_id, date_attribution, statut)
       VALUES ($1, $2, $3, NOW(), 'ACTIF')`,
      [personId, roleId, SCOPE_INSTITUTION[roleCode] || null]
    );
    console.log(`OK ${email} -> rôle ${roleCode} assigné`);
  }
  console.log("\n=== VÉRIFICATION FINALE ===");
  const check = await client.query(`
    SELECT p.email, r.code AS role_code
    FROM personne p
    LEFT JOIN personne_role pr ON pr.personne_id = p.personne_id
    LEFT JOIN role r ON r.role_id = pr.role_id
    WHERE p.email = ANY($1)
    ORDER BY p.email
  `, [emails]);
  console.log(check.rows);
  await client.end();
}
main().catch(e => { console.error("ERREUR FATALE :", e.message); process.exit(1); });