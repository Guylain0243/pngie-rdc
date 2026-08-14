const db = require('./src/db');
async function main() {
  const testId = require('crypto').randomUUID();
  const roleRow = await db.get('SELECT role_id FROM role LIMIT 1');
  await db.run(
    'INSERT INTO permission (permission_id, role_id, entite, action) VALUES (?,?,?,?)',
    [testId, roleRow.role_id, 'page:test', 'read']
  );
  const row = await db.get('SELECT * FROM permission WHERE permission_id = ?', [testId]);
  console.log('Ligne inseree :', row);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
