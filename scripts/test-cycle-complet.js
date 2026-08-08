const fs = require("fs");
const path = require("path");

function chargerEnvForce(nomFichier) {
  const p = path.join(__dirname, "..", nomFichier);
  const lines = fs.readFileSync(p, "utf8").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    process.env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
}
chargerEnvForce(".env.test");

const { login, apiRequest, clearTokenCache } = require("../tests/e2e/helpers");
const { institutionId, typeActeId } = JSON.parse(fs.readFileSync(path.join(__dirname, "donnees-test-cycle.json"), "utf8"));

function afficher(etape, resultat) {
  console.log(`\n=== ${etape} ===`);
  console.log("Statut :", resultat.status);
  console.log("Corps  :", JSON.stringify(resultat.body));
}

async function main() {
  clearTokenCache();
  const token = await login("PM");
  console.log("Connecte en PM. Token obtenu.");

  const creation = await apiRequest(token, "POST", "/api/journal/actes", {
    typeActeId, institutionEmettriceId: institutionId,
    titre: "Communique de test - cycle complet automatise",
    resume: "Test end-to-end du cycle de vie d'un acte.",
  });
  afficher("1. Creation (POST /actes)", creation);
  if (creation.status !== 201) { console.error("Arret : creation echouee."); process.exit(1); }
  const acteId = creation.body.data.id;

  const soumettre = await apiRequest(token, "POST", `/api/journal/actes/${acteId}/soumettre`);
  afficher("2. Soumission (brouillon -> soumis)", soumettre);

  const valider = await apiRequest(token, "POST", `/api/journal/actes/${acteId}/valider`);
  afficher("3. Validation (soumis -> valide)", valider);

  const signer = await apiRequest(token, "POST", `/api/journal/actes/${acteId}/signer`, {
    hashDocument: "hash-de-test-" + Date.now(),
    roleSignataire: "Primature",
  });
  afficher("4. Signature (valide -> signe)", signer);

  const publier = await apiRequest(token, "POST", `/api/journal/actes/${acteId}/publier`);
  afficher("5. Publication (signe -> publie)", publier);
  if (publier.status === 200) {
    console.log("\n>>> NUMERO OFFICIEL ATTRIBUE :", publier.body.data.numero_officiel);
  }

  const archiver = await apiRequest(token, "POST", `/api/journal/actes/${acteId}/archiver`);
  afficher("6. Archivage (publie -> archive)", archiver);

  const historique = await apiRequest(token, "GET", `/api/journal/actes/${acteId}/historique`);
  afficher("7. Historique complet", historique);
}
main().catch(e => { console.error("ERREUR FATALE :", e.message); process.exit(1); });
