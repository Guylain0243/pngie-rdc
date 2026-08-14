const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await c.connect();
  const r1 = await c.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'poste_role_metier' ORDER BY ordinal_position`);
  console.log("=== Colonnes poste_role_metier ===");
  console.table(r1.rows);

  console.log("\n=== Contenu de poste_role_metier (limit 20) ===");
  const r2 = await c.query(`SELECT * FROM poste_role_metier LIMIT 20`);
  console.table(r2.rows);

  console.log("\n=== Unites organisationnelles existantes pour Kinshasa ===");
  const r3 = await c.query(`SELECT unite_id, nom, type_unite FROM unite_organisationnelle WHERE institution_id = 'f9e7cb05-03d2-42ce-aa2a-732710897cb3'`);
  console.table(r3.rows);

  console.log("\n=== Postes existants contenant 'Gouverneur' ===");
  const r4 = await c.query(`SELECT poste_id, unite_id, intitule FROM poste WHERE intitule ILIKE '%gouverneur%'`);
  console.table(r4.rows);

  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
