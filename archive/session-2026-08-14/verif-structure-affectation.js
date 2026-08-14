const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await c.connect();
  const r1 = await c.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'poste' ORDER BY ordinal_position`);
  console.log("=== Colonnes poste ===");
  console.table(r1.rows);

  const r2 = await c.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'unite_organisationnelle' ORDER BY ordinal_position`);
  console.log("=== Colonnes unite_organisationnelle ===");
  console.table(r2.rows);

  const r3 = await c.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'affectation' ORDER BY ordinal_position`);
  console.log("=== Colonnes affectation ===");
  console.table(r3.rows);

  const r4 = await c.query(`SELECT institution_id, nom FROM institution WHERE nom ILIKE '%kinshasa%'`);
  console.log("=== institution_id de Kinshasa ===");
  console.table(r4.rows);

  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
