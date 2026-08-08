const db = require("./src/db");
(async () => {
  await db.run("UPDATE institution SET type_institution = 'PARLEMENT' WHERE code = 'CONGRES'");
  const row = await db.get("SELECT code, type_institution FROM institution WHERE code = 'CONGRES'");
  console.log("CONGRES corrige: " + JSON.stringify(row));
  process.exit(0);
})();
