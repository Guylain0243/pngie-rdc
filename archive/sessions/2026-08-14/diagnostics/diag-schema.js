const db = require('./src/db');

async function main() {
  const cols = await db.all(
    "SELECT column_name, data_type, ordinal_position FROM information_schema.columns WHERE table_name='permission' ORDER BY ordinal_position"
  );
  console.log('=== Colonnes de permission ===');
  console.log(cols);

  const pouvoirRows = await db.all("SELECT * FROM pouvoir");
  console.log('=== Lignes actuelles de pouvoir ===');
  console.log(pouvoirRows);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
