const db = require('./src/db');
async function main() {
  const colsOld = await db.all("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'relation_interinstitutionnelle' ORDER BY ordinal_position").catch(() => []);
  const colsNew = await db.all("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'relations' ORDER BY ordinal_position").catch(() => []);
  const countOld = await db.get("SELECT COUNT(*) as n FROM relation_interinstitutionnelle").catch(() => ({n: 'table absente ou erreur'}));
  const countNew = await db.get("SELECT COUNT(*) as n FROM relations").catch(() => ({n: 'table absente ou erreur'}));
  console.log('--- relation_interinstitutionnelle ---');
  console.log('Colonnes:', JSON.stringify(colsOld, null, 2));
  console.log('Nombre de lignes:', JSON.stringify(countOld));
  console.log('--- relations ---');
  console.log('Colonnes:', JSON.stringify(colsNew, null, 2));
  console.log('Nombre de lignes:', JSON.stringify(countNew));
}
main().then(() => process.exit(0)).catch(e => { console.error('Erreur:', e.message); process.exit(1); });