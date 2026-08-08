const bcrypt = require('bcrypt');
const db = require('./src/db');
async function main() {
  const newPassword = 'TestFinances2026!';
  const hash = await bcrypt.hash(newPassword, 10);
  await db.run("UPDATE person SET password_hash = ? WHERE email = ?", [hash, 'test.finances@rdc.gouv.cd']);
  console.log('Mot de passe reinitialise pour test.finances@rdc.gouv.cd');
}
main().then(() => process.exit(0)).catch(e => { console.error('Erreur:', e.message); process.exit(1); });
