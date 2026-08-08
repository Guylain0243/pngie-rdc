const db = require('./src/db');
(async () => {
  const rows = await db.all(
    "SELECT r.code AS role, p.code AS permission FROM role_permission rp JOIN role r ON r.role_id = rp.role_id JOIN permission p ON p.permission_id = rp.permission_id WHERE p.code LIKE 'agent:%' OR p.code LIKE 'affectation:%' ORDER BY r.code, p.code"
  );
  console.table(rows);
  process.exit();
})();
