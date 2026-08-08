const db = require('./src/db');
async function main() {
  const onPerson = await db.get("SELECT id, email FROM person WHERE email = $1", ['pm@rdc.gouv.cd']).catch(() => null);
  const onPersonne = await db.get("SELECT * FROM personne WHERE email = $1", ['pm@rdc.gouv.cd']).catch(() => null);
  console.log('Present sur "person" (utilisee par /api/auth/login):', JSON.stringify(onPerson));
  console.log('Present sur "personne" (table francaise, non utilisee par le login):', JSON.stringify(onPersonne));
}
main().then(() => process.exit(0)).catch(e => { console.error('Erreur:', e.message); process.exit(1); });