const db = require("./src/db");
(async () => {
  const rows = await db.all(`SELECT role_code, entity, action FROM meta_permission WHERE entity = 'unite_organisationnelle' ORDER BY role_code`);
  console.log(rows.map(r => r.role_code + " -> " + r.entity + "/" + r.action).join("\n"));
  process.exit(0);
})();
