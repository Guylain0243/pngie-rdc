const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnvAdmin() {
  const envPath = path.join(__dirname, "..", ".env.admin.local");
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
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

async function main() {
  const admin = loadEnvAdmin();
  const client = new Client({
    host: "localhost", port: 5432,
    user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
    database: "pngie_rdc_rls_test",
  });
  await client.connect();

  const fichier = path.join(__dirname, "..", "db", "migrations", "journal", "004_rls_journal.sql");
  const sql = fs.readFileSync(fichier, "utf8");

  try {
    await client.query(sql);
    console.log("OK : 004_rls_journal.sql");
  } catch (e) {
    console.error("ERREUR :", e.message);
    if (e.position) {
      const pos = parseInt(e.position, 10);
      const debut = Math.max(0, pos - 60);
      const fin = Math.min(sql.length, pos + 60);
      console.log("\n=== Contexte autour du caractère fautif (position " + pos + ") ===");
      console.log(JSON.stringify(sql.substring(debut, fin)));
      console.log(" ".repeat(20 + (pos - debut)) + "^-- ICI");
    }
    // Vérification de caractères non-ASCII suspects (quotes typographiques, etc.)
    const suspects = [];
    for (let i = 0; i < sql.length; i++) {
      const code = sql.charCodeAt(i);
      if (code > 127 && ![233,232,224,244,238,251,231,234].includes(code)) { // exclut les accents français courants
        suspects.push({ index: i, char: sql[i], code });
      }
    }
    if (suspects.length) {
      console.log("\n=== Caractères non-standards détectés ===");
      suspects.slice(0, 20).forEach(s => console.log(`  position ${s.index} : '${s.char}' (code ${s.code})`));
    } else {
      console.log("\nAucun caractère non-standard détecté (le problème n'est pas une quote typographique).");
    }
  } finally {
    await client.end();
  }
}
main();
