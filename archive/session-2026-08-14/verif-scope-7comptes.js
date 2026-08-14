const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await c.connect();
  const r = await c.query(`
    SELECT p.email, r.code AS role_code, pr.scope_org_id, o.nom AS institution_nom
    FROM person p
    JOIN person_role pr ON pr.person_id = p.person_id
    JOIN role r ON r.role_id = pr.role_id
    LEFT JOIN organization o ON o.organization_id = pr.scope_org_id
    WHERE p.email IN (
      'an@rdc.gouv.cd','sn@rdc.gouv.cd','ace@rdc.gouv.cd','gv@rdc.gouv.cd',
      'pr@rdc.gouv.cd','pm@rdc.gouv.cd','mi@rdc.gouv.cd'
    )
    ORDER BY p.email
  `);
  console.table(r.rows);
  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
