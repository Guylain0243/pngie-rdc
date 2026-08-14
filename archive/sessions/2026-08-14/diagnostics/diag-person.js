const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await c.connect();
  const r = await c.query("SELECT table_name, table_type FROM information_schema.tables WHERE table_name='person'");
  console.log('TYPE:', JSON.stringify(r.rows));
  const r2 = await c.query("SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name='person'");
  console.log('DROITS:', JSON.stringify(r2.rows));
  await c.end();
}

main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
