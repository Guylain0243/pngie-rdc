/**
 * Charge les mêmes variables d'environnement que start-server-force-env.js
 * (depuis C:\pngie-rdc\.env.development), puis exécute le script de
 * diagnostic passé en argument, DANS LE MÊME PROCESSUS, pour que les
 * variables (DATABASE_URL, PGPASSWORD, etc.) soient déjà en place.
 *
 * Évite d'avoir à copier/coller manuellement un mot de passe.
 *
 * Usage :
 *   node run-with-env.js scripts/diagnostic/list_roles_and_permissions.js
 *   node run-with-env.js scripts/diagnostic/diag_ministeres_vide.js
 */

const fs = require("fs");
const path = require("path");

function chargerEnvForce(nomFichier) {
  const p = path.join(__dirname, "..", nomFichier);
  console.log(`[run-with-env] Chargement de : ${p}`);
  const lines = fs.readFileSync(p, "utf8").split("\n");
  let count = 0;
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    const key = t.slice(0, idx).trim();
    process.env[key] = t.slice(idx + 1).trim();
    count++;
  }
  console.log(`[run-with-env] ${count} variable(s) chargée(s).`);
}

const scriptCible = process.argv[2];
if (!scriptCible) {
  console.error("❌ Usage : node run-with-env.js <chemin/vers/script.js>");
  process.exit(1);
}

chargerEnvForce(".env.development");

const cheminAbsolu = path.resolve(process.cwd(), scriptCible);
console.log(`[run-with-env] Exécution de : ${cheminAbsolu}\n`);
require(cheminAbsolu);