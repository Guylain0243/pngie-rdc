const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await c.connect();

  console.log("=== Toutes les institutions en base (avec leur type) ===");
  const r1 = await c.query(`SELECT organization_id, nom, type_institution FROM institution ORDER BY nom`);
  console.table(r1.rows);

  console.log("\n=== Tous les comptes @rdc.gouv.cd avec leur role et institution rattachee ===");
  const r2 = await c.query(`
    SELECT p.email, r.code AS role_code, pr.scope_org_id, o.nom AS institution_nom
    FROM person p
    JOIN person_role pr ON pr.person_id = p.person_id
    JOIN role r ON r.role_id = pr.role_id
    LEFT JOIN organization o ON o.organization_id = pr.scope_org_id
    WHERE p.email LIKE '%@rdc.gouv.cd'
    ORDER BY p.email
    LIMIT 20
  `);
  console.table(r2.rows);

  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
