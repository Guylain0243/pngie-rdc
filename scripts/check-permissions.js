const { Client } = require('pg');
async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const r = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name ILIKE '%migration%'
  `);
  console.log(JSON.stringify(r.rows, null, 2));
  await client.end();
}
main().catch(e => { console.error('ERREUR FATALE :', e.message); process.exit(1); });
