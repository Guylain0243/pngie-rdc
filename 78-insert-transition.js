const db = require("./src/db");
(async () => {
  await db.run(
    "INSERT INTO meta_workflow_transition (entity, from_statut, to_statut, role_code_requis, statut) VALUES (?,?,?,?,?)",
    ["ordre_paiement", "EN_ATTENTE", "PAYE", "MI", "ACTIF"]
  );
  console.log("Transition inseree.");
  const r = await db.all("SELECT * FROM meta_workflow_transition WHERE entity = ?", ["ordre_paiement"]);
  console.log(r);
})().catch(e => console.log("ERREUR:", e.message));
