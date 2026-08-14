const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await c.connect();

  const colsPR = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'person_role'`);
  console.log('Colonnes person_role:', colsPR.rows.map(r => r.column_name).join(', '));

  const colsPersonneRole = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'personne_role'`);
  console.log('Colonnes personne_role:', colsPersonneRole.rows.map(r => r.column_name).join(', '));

  const data = await c.query(`
    SELECT p.email, r.code, pr.*
    FROM person p
    JOIN person_role pr ON pr.person_id = p.person_id
    JOIN role r ON r.role_id = pr.role_id
    WHERE p.email = $1`, ['pm@rdc.gouv.cd']);
  console.log('--- person_role pour pm@ ---');
  console.log(JSON.stringify(data.rows, null, 2));

  await c.end();
}
main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
