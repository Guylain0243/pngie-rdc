// scripts/preload-env-test.js
// Charge .env.test automatiquement, désactive la barrière HTTP, et force le port.
// Usage : node -r ./scripts/preload-env-test.js src/server.js
//         node -r ./scripts/preload-env-test.js --test tests/e2e/xxx.test.js
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.test");
const lines = fs.readFileSync(envPath, "utf8").split("\n");
for (const line of lines) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const idx = t.indexOf("=");
  if (idx === -1) continue;
  process.env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
}

process.env.GATE_USER = "";
process.env.GATE_PASS = "";
if (!process.env.PNGIE_API_URL) {
  process.env.PNGIE_API_URL = "http://localhost:4000";
}

console.log("[preload-env-test] .env.test charge, GATE desactive, PNGIE_API_URL =", process.env.PNGIE_API_URL);