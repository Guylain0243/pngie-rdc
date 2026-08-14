const db = require('./src/db');
const crypto = require('crypto');
const uuid = () => crypto.randomUUID();

async function main() {
  const roleRow = await db.get('SELECT role_id FROM role LIMIT 1');
  const roleIds = { PR: roleRow.role_id };
  const PAGES = ['dashboard','population'];
  const ROLE_PAGES = { PR: PAGES };

  for (const [roleCode, pages] of Object.entries(ROLE_PAGES)) {
    for (const p of pages) {
      const id = uuid();
      const params = [id, roleIds[roleCode], 'page:' + p, 'read'];
      console.log('PARAMS:', JSON.stringify(params));
      await db.run(
        'INSERT INTO permission (permission_id, role_id, entite, action) VALUES (?,?,?,?)',
        params
      );
      const row = await db.get('SELECT * FROM permission WHERE permission_id = ?', [id]);
      console.log('ROW:', row);
    }
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
