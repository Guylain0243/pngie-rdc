const db = require('./src/db');

async function main() {
  const triggers = await db.all(
    "SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'permission'::regclass AND NOT tgisinternal"
  );
  console.log('=== Triggers sur permission ===');
  console.log(triggers);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
