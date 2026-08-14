const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await c.connect();
  const r = await c.query("SELECT relname, relkind, relnamespace::regnamespace AS schema FROM pg_class WHERE relname='person'");
  console.log('OBJET:', JSON.stringify(r.rows));
  const r2 = await c.query("SELECT relacl FROM pg_class WHERE relname='person'");
  console.log('ACL:', JSON.stringify(r2.rows));
  const r3 = await c.query("SELECT current_user, session_user");
  console.log('UTILISATEUR:', JSON.stringify(r3.rows));
  await c.end();
}

main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
