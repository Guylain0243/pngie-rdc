const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await c.connect();

  console.log("=== Colonnes de la table institution ===");
  const cols1 = await c.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'institution' ORDER BY ordinal_position
  `);
  console.table(cols1.rows);

  console.log("\n=== Contenu de la table institution (limit 20) ===");
  const rows1 = await c.query(`SELECT * FROM institution LIMIT 20`);
  console.table(rows1.rows);

  console.log("\n=== Contenu de la table organization correspondant a scope_org_id de ace@ et mi@ ===");
  const rows2 = await c.query(`
    SELECT organization_id, nom, type_id FROM organization
    WHERE organization_id IN (
      '38dc68a3-798e-4a90-99ed-2794049abc61',
      '9302de00-3057-42db-a4e5-f080b536286b'
    )
  `);
  console.table(rows2.rows);

  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
