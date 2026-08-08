const db = require("./src/db");
(async () => {
  await db.run(
    `INSERT INTO relation_type (code, libelle, description) VALUES (?, ?, ?) ON CONFLICT (code) DO NOTHING`,
    ["RATTACHEMENT_CONSTITUTIONNEL", "Rattachement constitutionnel", "Appartenance a l architecture de l Etat sans lien de tutelle administrative. L institution conserve son independance fonctionnelle."]
  );
  console.log("Type RATTACHEMENT_CONSTITUTIONNEL ajoute.");
  process.exit(0);
})();
