const db = require("./src/db");

(async () => {
  const tables = await db.all(`
    SELECT DISTINCT table_name
    FROM information_schema.tables
    WHERE table_schema='public'
      AND table_type='BASE TABLE'
    ORDER BY table_name
  `);
  console.log(tables.map(t => t.table_name).join("\n"));
  process.exit(0);
})();
