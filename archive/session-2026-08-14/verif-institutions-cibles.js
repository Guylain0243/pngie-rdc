const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await c.connect();
  const r = await c.query(`
    SELECT organization_id, nom, type_id
    FROM organization
    WHERE nom ILIKE '%assemblee%' OR nom ILIKE '%senat%' OR nom ILIKE '%gouvernement%'
       OR nom ILIKE '%primature%' OR nom ILIKE '%presidence%' OR nom ILIKE '%ministere%'
       OR nom ILIKE '%congres%'
    ORDER BY nom
  `);
  console.table(r.rows);
  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
