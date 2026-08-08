const db = require("./src/db");
(async () => {
  const p = await db.get("SELECT person_id FROM person WHERE email = ?", ["test.finances@rdc.gouv.cd"]);
  if (p) {
    await db.run("DELETE FROM person_role WHERE person_id = ?", [p.person_id]);
    await db.run("DELETE FROM person WHERE person_id = ?", [p.person_id]);
    console.log("Compte test et roles supprimes.");
  } else {
    console.log("Aucun compte test a supprimer.");
  }
})().catch(e => console.log("ERREUR:", e.message));
