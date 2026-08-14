const { Client } = require('pg');
const bcrypt = require('bcrypt');
const c = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await c.connect();
  const emails = ['an@rdc.gouv.cd','ace@rdc.gouv.cd','pm@rdc.gouv.cd','pr@rdc.gouv.cd','sn@rdc.gouv.cd'];
  for (const email of emails) {
    const r = await c.query('SELECT password_hash FROM person WHERE email=$1', [email]);
    if (r.rows[0]) {
      const ok = await bcrypt.compare('Pngie#2027', r.rows[0].password_hash);
      console.log(email, '->', ok);
    } else {
      console.log(email, '-> COMPTE INTROUVABLE');
    }
  }
  await c.end();
}

main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
