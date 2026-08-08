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
chargerEnvForce(".env.development");
require("./src/server.js");
