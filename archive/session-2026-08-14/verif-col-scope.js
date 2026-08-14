const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await c.connect();
  const r = await c.query(`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_name = 'person_role' AND column_name = 'scope_org_id'
  `);
  console.table(r.rows);
  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
