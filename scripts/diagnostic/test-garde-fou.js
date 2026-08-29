const { ALLOWED_DATABASES } = require('./config/bootstrap.config');
const maskUrl = (url) => url.replace(/:[^:@]+@/, ":****@");

async function testerGardeFou() {
  console.log("--- Test du garde-fou (isole, sans TRUNCATE) ---");
  console.log("NODE_ENV      :", process.env.NODE_ENV || "(vide)");
  console.log("DATABASE_URL  :", process.env.DATABASE_URL ? maskUrl(process.env.DATABASE_URL) : "(vide)");

  if (process.env.NODE_ENV === "production") {
    throw new Error("[SEED BLOQUE] Execution interdite avec NODE_ENV=production.");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("[SEED BLOQUE] DATABASE_URL non definie.");
  }
  if (!ALLOWED_DATABASES.some(db => process.env.DATABASE_URL.includes(db))) {
    throw new Error(`[SEED BLOQUE] DATABASE_URL suspecte : ${maskUrl(process.env.DATABASE_URL)}`);
  }

  const db0 = require('./src/db');
  const row = await db0.get("SELECT current_database() AS db");
  const connectedDb = row.db;
  if (!ALLOWED_DATABASES.includes(connectedDb)) {
    throw new Error(`[SEED BLOQUE] Base connectee non autorisee : ${connectedDb} (driver: ${db0.driver})`);
  }
  console.log(`[OK] Garde-fou franchi : base autorisee (${db0.driver}) =`, connectedDb);
  await db0.close();
}

testerGardeFou()
  .then(() => { console.log("RESULTAT : PASS (aucun blocage, base autorisee)"); process.exit(0); })
  .catch(e => { console.log("RESULTAT : BLOQUE -", e.message); process.exit(1); });