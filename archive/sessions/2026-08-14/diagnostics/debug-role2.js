const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await c.connect();

  const allPr = await c.query('SELECT COUNT(*) FROM personne_role');
  console.log('Total lignes personne_role:', allPr.rows[0].count);

  const cols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'personne'`);
  console.log('Colonnes de personne:', cols.rows.map(r => r.column_name).join(', '));

  const roles = await c.query('SELECT * FROM role LIMIT 20');
  console.log('--- roles disponibles ---');
  console.log(JSON.stringify(roles.rows, null, 2));

  await c.end();
}
main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
