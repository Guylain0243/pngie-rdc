const { Pool } = require("pg");
const pool = new Pool({ connectionString: "postgresql://postgres@localhost/pngie_rdc_rls_test" });
(async () => {
  const res = await pool.query(`
    SELECT pe.email, pr.scope_institution_id
    FROM personne pe
    JOIN personne_role pr ON pr.personne_id = pe.personne_id
    WHERE pe.email LIKE 'test-%@pngie.local'
    ORDER BY pe.email
  `);
  console.table(res.rows);
  await pool.end();
})();
