const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("--- Test A : SANS aucun SET LOCAL (contexte jamais initialise) ---");
    const resA = await client.query("SELECT COUNT(*) as total FROM institution");
    console.log("Lignes visibles: " + resA.rows[0].total + " (total reel en base: 245)");

    await client.query("ROLLBACK");
    await client.query("BEGIN");

    console.log("`n--- Test B : avec current_institution_id = valeur bidon (UUID inexistant) ---");
    await client.query("SELECT set_config('app.current_institution_id', $1, true)", ["00000000-0000-0000-0000-000000000000"]);
    const resB = await client.query("SELECT COUNT(*) as total FROM institution");
    console.log("Lignes visibles: " + resB.rows[0].total + " (attendu: tres peu, si RLS filtre reellement)");

    await client.query("ROLLBACK");
    await client.query("BEGIN");

    console.log("`n--- Test C : current_institution_id = chaine vide explicite ---");
    await client.query("SELECT set_config('app.current_institution_id', '', true)");
    const resC = await client.query("SELECT COUNT(*) as total FROM institution");
    console.log("Lignes visibles: " + resC.rows[0].total);

    await client.query("ROLLBACK");
  } finally {
    client.release();
    await pool.end();
  }
})();
