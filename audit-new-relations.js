const db = require('./src/db');
async function main() {
  const rows = await db.all("SELECT * FROM relations");
  console.log(JSON.stringify(rows, null, 2));
}
main().then(() => process.exit(0)).catch(e => { console.error('Erreur:', e.message); process.exit(1); });