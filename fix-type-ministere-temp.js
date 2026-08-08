const db = require("./src/db");
(async () => {
  const r = await db.run("UPDATE institution SET type_institution = 'MINISTERE' WHERE type_institution = 'ministere'");
  const rows = await db.all("SELECT code, nom FROM institution WHERE type_institution = 'MINISTERE' AND code IN ('MIN_FINANCES', 'MIN_AFF_COUTUM')");
  console.log("Institutions corrigees: " + rows.map(r => r.code).join(", "));
  process.exit(0);
})();
