const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await c.connect();

  const p = await c.query('SELECT personne_id, email FROM personne WHERE email = $1', ['pm@rdc.gouv.cd']);
  console.log('--- personne ---');
  console.log(JSON.stringify(p.rows, null, 2));

  if (p.rows.length > 0) {
    const pid = p.rows[0].personne_id;
    const pr = await c.query('SELECT * FROM personne_role WHERE personne_id = $1', [pid]);
    console.log('--- personne_role ---');
    console.log(JSON.stringify(pr.rows, null, 2));
  }

  await c.end();
}
main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
