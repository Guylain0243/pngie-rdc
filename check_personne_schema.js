const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query(
    "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name='personne' ORDER BY ordinal_position"
  );
  console.log(r.rows);
  await c.end();
})();
