const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
function chargerEnv(f) {
  const lines = fs.readFileSync(path.join(__dirname, "..", f), "utf8").split("\n");
  const env = {};
  for (const l of lines) { const t = l.trim(); if (!t || t.startsWith("#")) continue; const i = t.indexOf("="); if (i === -1) continue; env[t.slice(0,i).trim()] = t.slice(i+1).trim(); }
  return env;
}
async function main() {
  const admin = chargerEnv(".env.admin.local");
  const client = new Client({ host: "localhost", port: 5432, user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD, database: "pngie_rdc_rls_test" });
  await client.connect();
  let sql = fs.readFileSync(path.join(__dirname, "..", "db", "migrations", "journal", "007_fix_trigger_audit_argument.sql"), "utf8");
  if (sql.charCodeAt(0) === 0xFEFF) sql = sql.slice(1);

  // Test direct : quelle valeur to_jsonb(NEW)->>'id' donnerait-il en pratique ?
  console.log("=== Verification directe du declencheur du bug ===");
  const testDirect = await client.query(`
    DO $$
    DECLARE v_test TEXT;
    BEGIN
      v_test := (to_jsonb(ROW(1,'x'::text))->>0);
      RAISE NOTICE 'test row: %', v_test;
    END $$;
  `).catch(e => console.log("test annexe ignore:", e.message));

  await client.query(sql);
  console.log("OK : 007 appliquee (triggers recrees).");
  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
