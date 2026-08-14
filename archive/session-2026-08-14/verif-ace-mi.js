const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await c.connect();

  console.log("=== Tous les roles dont le code contient ACE ou MI ===");
  const r1 = await c.query(`SELECT role_id, code, nom, categorie FROM role WHERE code ILIKE '%ACE%' OR code ILIKE '%MI%' ORDER BY code`);
  console.table(r1.rows);

  console.log("\n=== Institution (scope_org_id) rattachee a ace@ et mi@ ===");
  const r2 = await c.query(`
    SELECT p.email, pr.scope_org_id, o.nom AS institution_nom
    FROM person p
    JOIN person_role pr ON pr.person_id = p.person_id
    LEFT JOIN organization o ON o.organization_id = pr.scope_org_id
    WHERE p.email IN ('ace@rdc.gouv.cd','mi@rdc.gouv.cd')
    ORDER BY p.email
  `);
  console.table(r2.rows);

  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
