const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await c.connect();
  const r = await c.query(
    `SELECT p.email, pr.role_id, pr.scope_institution_id, r.nom AS role_nom
     FROM personne p
     JOIN personne_role pr ON pr.personne_id = p.personne_id
     JOIN role r ON r.role_id = pr.role_id
     WHERE p.email = $1`,
    ['pm@rdc.gouv.cd']
  );
  console.log(JSON.stringify(r.rows, null, 2));
  await c.end();
}
main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
