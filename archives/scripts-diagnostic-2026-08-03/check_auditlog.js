const { Pool } = require('pg');
const fs = require('fs');
const cs = fs.readFileSync('db_url.txt', 'utf8').match(/DATABASE_URL=(.+)/)[1].trim();
const p = new Pool({ connectionString: cs });

(async () => {
  const cols = await p.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'audit_log' ORDER BY ordinal_position"
  ).catch(err => ({ rows: [], err: err.message }));
  console.log('colonnes audit_log:', JSON.stringify(cols.rows));

  const rows = await p.query('SELECT * FROM audit_log ORDER BY 1 DESC LIMIT 15').catch(err => ({ rows: [], err: err.message }));
  console.log('dernieres lignes audit_log:', JSON.stringify(rows.rows, null, 2));

  await p.end();
})().catch(err => console.log('ERREUR:', err.message));
