const fs = require("fs");
const path = require("path");

function chargerEnv(nomFichier) {
  const p = path.join(__dirname, "..", nomFichier);
  const lines = fs.readFileSync(p, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
  return env;
}

const test = chargerEnv(".env.test");

const contenu = `# ============================================================
# PNGIE-RDC — Configuration de developpement officielle
# ============================================================
# Decision de gouvernance (08/08/2026) :
#   Base de developpement officielle jusqu'a la livraison V1.0 : pngie_rdc_rls_test
#   Utilisateur applicatif : pngie_app
#   pngie_rdc devient une base de reference : on n'y applique que des lots
#   COMPLETS et VALIDES (migrations + backend + E2E + doc), jamais de travail
#   en cours directement.
#
#   Toutes les nouvelles migrations (006, 007, 008...) ciblent cette base.
#   Ne pas committer ce fichier (voir .gitignore).
# ============================================================

DATABASE_URL=${test.DATABASE_URL}
PGPASSWORD=${test.PGPASSWORD}
JWT_SECRET=${test.JWT_SECRET}
GATE_USER=${test.GATE_USER || ""}
GATE_PASS=${test.GATE_PASS || ""}
RATE_LIMIT_DISABLED=${test.RATE_LIMIT_DISABLED || ""}
`;

fs.writeFileSync(path.join(__dirname, "..", ".env.development"), contenu, "utf8");
console.log(".env.development cree.");
console.log("DATABASE_URL (masque) :", (test.DATABASE_URL || "").replace(/:[^:@]+@/, ":****@"));
