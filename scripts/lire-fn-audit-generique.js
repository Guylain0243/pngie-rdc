const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function chargerEnv(nomFichier) {
  const p = path.join(__dirname, "..", nomFichier);
  const lines = fs.readFileSync(p, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
  return env;
}

async function main() {
  const admin = chargerEnv(".env.admin.local");
  const client = new Client({
    host: "localhost", port: 5432,
    user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
    database: "pngie_rdc_rls_test",
  });
  await client.connect();

  console.log("=== Code source complet de fn_audit_generique ===");
  const r = await client.query(`SELECT prosrc FROM pg_proc WHERE proname = 'fn_audit_generique'`);
  console.log(r.rows[0]?.prosrc || "INTROUVABLE");

  console.log("\n=== Definition EXACTE d'un trigger existant (document), argument inclus ===");
  const trg = await client.query(`
    SELECT pg_get_triggerdef(oid) AS def
    FROM pg_trigger
    WHERE tgname = 'trg_audit_document'
  `);
  trg.rows.forEach(row => console.log(row.def));

  await client.end();
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
