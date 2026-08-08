const fs = require("fs");
const path = require("path");

// Force les valeurs de .env.development EN ECRASANT tout ce qui est deja
// present dans process.env (au lieu de ne definir que si absent) — evite
// toute dependance a un heritage Windows potentiellement obsolete.
function chargerEnvForce(nomFichier) {
  const p = path.join(__dirname, "..", nomFichier);
  const lines = fs.readFileSync(p, "utf8").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    const key = t.slice(0, idx).trim();
    const val = t.slice(idx + 1).trim();
    process.env[key] = val; // toujours ecraser
  }
}

chargerEnvForce(".env.test"); // contient PNGIE_TEST_PASSWORD, on force sa vraie valeur

console.log("PNGIE_TEST_PASSWORD force a la valeur de .env.test (longueur " + process.env.PNGIE_TEST_PASSWORD.length + ").");

require("../tests/e2e/helpers"); // sanity check chargement
const { login, apiRequest, TEST_ACCOUNTS, clearTokenCache } = require("../tests/e2e/helpers");

async function main() {
  clearTokenCache(); // supprime tout token cache avec l'ancien mot de passe
  const roleKey = Object.keys(TEST_ACCOUNTS)[0];
  console.log(`Connexion avec le compte de test : ${roleKey}`);
  const token = await login(roleKey);
  console.log("Token obtenu (longueur " + token.length + ").");

  console.log("\n=== GET /api/journal/types ===");
  const resultat = await apiRequest(token, "GET", "/api/journal/types");
  console.log("Statut HTTP :", resultat.status);
  console.log("Corps :", JSON.stringify(resultat.body, null, 2));
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
