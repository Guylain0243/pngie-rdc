const { Pool } = require("pg");
const pw = ":NI=CcM#D.jL(i#ni1v&[^qU";
const url = `postgresql://pngie_app:${encodeURIComponent(pw)}@localhost/pngie_rdc_rls_test`;
const pool = new Pool({ connectionString: url });
(async () => {
  try {
    const res = await pool.query("SELECT current_user");
    console.log("Connexion reussie :", res.rows);
  } catch (e) {
    console.log("ERREUR :", e.message);
  } finally {
    await pool.end();
  }
})();
