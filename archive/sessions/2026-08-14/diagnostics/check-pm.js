const { Client } = require('pg');
const bcrypt = require('bcrypt');
const c = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await c.connect();
  const r = await c.query("SELECT person_id, email, password_hash FROM person WHERE email='pm@rdc.gouv.cd'");
  console.log('COMPTE:', JSON.stringify(r.rows));
  if (r.rows[0]) {
    const ok = await bcrypt.compare('Pngie#2027', r.rows[0].password_hash);
    console.log('MOT DE PASSE VALIDE:', ok);
  }
  await c.end();
}

main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
