const db = require('./src/db');
async function main() {
  const rows = await db.all("SELECT * FROM person WHERE email = ? LIMIT 1", ['test.finances@rdc.gouv.cd']);
  console.log(JSON.stringify(rows, null, 2));
}
main().then(() => process.exit(0)).catch(e => { console.error('Erreur:', e.message); process.exit(1); });
