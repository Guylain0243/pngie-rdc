const fs = require("fs");
const path = require("path");

function chargerEnvTest() {
  const envPath = path.join(__dirname, "..", ".env.test");
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    const key = t.slice(0, idx).trim();
    const val = t.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

chargerEnvTest();

const requises = ["PNGIE_TEST_PASSWORD"];
const manquantes = requises.filter(k => !process.env[k]);
if (manquantes.length) {
  console.error("Variables manquantes dans .env.test :", manquantes.join(", "));
  console.error("Variables presentes dans .env.test :", Object.keys(process.env).filter(k => k.startsWith("PNGIE_") || k.startsWith("GATE_")).join(", ") || "(aucune trouvee)");
  process.exit(1);
}

const { login, apiRequest, TEST_ACCOUNTS } = require(path.join(__dirname, "..", "tests", "e2e", "helpers"));

async function main() {
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
