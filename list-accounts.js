const db = require('./src/db');
async function main() {
  const rows = await db.all("SELECT person_id, email FROM person ORDER BY email");
  console.log(JSON.stringify(rows, null, 2));
}
main().then(() => process.exit(0)).catch(e => { console.error('Erreur:', e.message); process.exit(1); });
