const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await c.connect();
  const r1 = await c.query(`SELECT organization_id, nom FROM organization WHERE organization_id = 'caa61add-1ff7-4021-8913-ae1b46f1f0bd'`);
  console.log("Recherche par ID exact dans organization:");
  console.table(r1.rows);

  const r2 = await c.query(`SELECT organization_id, nom FROM organization WHERE nom = 'Finances'`);
  console.log("Recherche par nom exact 'Finances' dans organization:");
  console.table(r2.rows);
  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
