const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

function loadEnvTest() {
  const envPath = path.join(__dirname, "..", ".env.test");
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    process.env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
}
loadEnvTest();

const token = process.argv[2];
const decoded = jwt.decode(token);
console.log("Payload du token décodé :", JSON.stringify(decoded, null, 2));
