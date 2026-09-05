const Database = require("better-sqlite3");
const fs = require("fs");

const dbPath = "docs/sprint-2c/schema-test.db";
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

const sql = fs.readFileSync("db/schema.sqlite.sql", "utf8");

try {
  db.exec(sql);
  console.log("SUCCESS - schema.sqlite.sql complet charge sans erreur");
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log(`Nombre total de tables: ${tables.length}`);
  const fkIssues = db.pragma("foreign_key_check");
  console.log(`Problemes FK: ${fkIssues.length}`);
} catch (e) {
  console.log("FAIL - " + e.message);
}
db.close();
