const crypto = require("crypto");
const db = require("./src/db");
(async () => {
  const presidence = await db.get("SELECT institution_id FROM institution WHERE code = 'PRESIDENCE'");
  const codes = ["CNDH", "CENI", "ARMP", "CES", "CSM", "CSAC", "MEDIATEUR"];
  for (const code of codes) {
    const inst = await db.get("SELECT institution_id, nom FROM institution WHERE code = ?", [code]);
    if (!inst) { console.log(code + " : INTROUVABLE"); continue; }
    const exists = await db.get(
      `SELECT institution_relation_id FROM institution_relation WHERE institution_source_id = ? AND institution_cible_id = ? AND type_relation = ?`,
      [presidence.institution_id, inst.institution_id, "RATTACHEMENT_CONSTITUTIONNEL"]
    );
    if (exists) { console.log(code + " deja rattache"); continue; }
    await db.run(
      `INSERT INTO institution_relation (institution_relation_id, institution_source_id, institution_cible_id, type_relation) VALUES (?, ?, ?, ?)`,
      [crypto.randomUUID(), presidence.institution_id, inst.institution_id, "RATTACHEMENT_CONSTITUTIONNEL"]
    );
    console.log(code + " (" + inst.nom + ") rattache a PRESIDENCE via RATTACHEMENT_CONSTITUTIONNEL");
  }
  process.exit(0);
})();
