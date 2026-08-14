const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await c.connect();

  console.log("=== Nombre total de lignes dans organization ===");
  const count = await c.query(`SELECT COUNT(*) FROM organization`);
  console.log(count.rows[0]);

  console.log("\n=== Contenu integral de organization ===");
  const r = await c.query(`SELECT organization_id, nom, type_id FROM organization ORDER BY nom`);
  console.table(r.rows);

  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
