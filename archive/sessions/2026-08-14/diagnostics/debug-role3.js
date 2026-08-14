const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await c.connect();
  const r = await c.query(
    `SELECT p.email, r.code, r.nom, pr.scope_institution_id
     FROM person p
     JOIN person_role pr ON pr.person_id = p.person_id
     JOIN role r ON r.role_id = pr.role_id
     WHERE p.email = $1`,
    ['pm@rdc.gouv.cd']
  );
  console.log(JSON.stringify(r.rows, null, 2));
  await c.end();
}
main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
