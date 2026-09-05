const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='personne_role' ORDER BY ordinal_position"
  );
  console.log(r.rows);
  await c.end();
})();
