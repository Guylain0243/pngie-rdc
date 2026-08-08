const db = require("./src/db");
const crypto = require("crypto");

async function main() {
  const id = crypto.randomUUID();
  await db.run(
    "INSERT INTO ordre_paiement (ordre_paiement_id, beneficiaire, montant, institution, statut) VALUES (?, ?, ?, ?, ?)",
    [id, "Test Fournisseur XYZ", 15000, "Ministere des Finances", "EN_ATTENTE"]
  );
  console.log("Ordre cree: " + id);
  console.log("Tente de passer directement a PAYE sans validation...");
  console.log("ID a utiliser pour le test curl: " + id);
}

main().catch(err => { console.error(err); process.exit(1); });
