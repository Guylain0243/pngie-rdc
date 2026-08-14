const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await c.connect();
  const r = await c.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
  console.log(r.rows.map(x => x.table_name).join(", "));
  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
