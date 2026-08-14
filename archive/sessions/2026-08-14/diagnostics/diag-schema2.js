const db = require('./src/db');

async function main() {
  const rpCols = await db.all(
    "SELECT column_name, data_type, ordinal_position FROM information_schema.columns WHERE table_name='role_permission' ORDER BY ordinal_position"
  );
  console.log('=== Colonnes de role_permission ===');
  console.log(rpCols);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
