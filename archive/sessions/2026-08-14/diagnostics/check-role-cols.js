const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await c.connect();
  const cols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'role'`);
  console.log('Colonnes de role:', cols.rows.map(r => r.column_name).join(', '));
  await c.end();
}
main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
