const { Pool } = require('pg');
const fs = require('fs');
const cs = fs.readFileSync('db_url.txt', 'utf8').match(/DATABASE_URL=(.+)/)[1].trim();
const p = new Pool({ connectionString: cs });

(async () => {
  const e = await p.query('SELECT count(*) FROM meta_entity');
  console.log('meta_entity count:', e.rows[0].count);

  const j = await p.query('SELECT count(*) FROM journal_audit').catch(() => ({ rows: [{ count: 'table absente' }] }));
  console.log('journal_audit count:', j.rows[0].count);

  const a = await p.query(
    "SELECT * FROM journal_audit WHERE action ILIKE '%meta_attribute%' OR details::text ILIKE '%meta_attribute%' LIMIT 20"
  ).catch(err => ({ rows: [], err: err.message }));
  console.log('traces meta_attribute dans audit:', JSON.stringify(a.rows, null, 2));

  await p.end();
})().catch(err => console.log('ERREUR:', err.message));
