const db = require("./src/db");
(async () => {
  const targets = {
    AN: "Assemblee Nationale", GV: "Gouvernorat", MI: "ministere",
    PM: "PRIMATURE", PR: "PRESIDENCE", SN: "Senat"
  };
  for (const [role, hint] of Object.entries(targets)) {
    const rows = await db.all(
      `SELECT institution_id, code, nom, type_institution FROM institution WHERE nom ILIKE ? OR type_institution ILIKE ? OR code ILIKE ? LIMIT 3`,
      ["%" + hint + "%", "%" + hint + "%", "%" + hint + "%"]
    );
    console.log(role + " (" + hint + ") :");
    console.log(rows.length ? rows.map(r => "  " + r.code + " | " + r.nom + " | " + r.type_institution).join("\n") : "  AUCUNE CORRESPONDANCE");
  }
  process.exit(0);
})();
