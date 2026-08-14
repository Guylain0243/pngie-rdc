const db = require('./src/db');

async function main() {
  const cols = await db.all(
    "SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name='permission' ORDER BY ordinal_position"
  );
  console.log('=== Nullabilité de permission ===');
  console.log(cols);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
