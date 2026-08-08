const db = require("./src/db");
(async () => {
  const an = await db.all(`SELECT institution_id, code, nom, type_institution FROM institution WHERE type_institution = 'PARLEMENT'`);
  console.log("--- PARLEMENT ---");
  console.log(an.map(r => r.code + " | " + r.nom).join("\n"));

  const gv = await db.all(`SELECT institution_id, code, nom, type_institution FROM institution WHERE type_institution = 'PROVINCE' ORDER BY code LIMIT 5`);
  console.log("`n--- PROVINCE (5 premieres) ---");
  console.log(gv.map(r => r.code + " | " + r.nom).join("\n"));
  process.exit(0);
})();
