const Database = require("better-sqlite3");
const fs = require("fs");

const dbPath = "docs/sprint-2c/test.db";
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

const files = fs.readdirSync("docs/sprint-2c/generated").filter(f => f.endsWith(".sql"));

let ok = [];
let fail = [];

for (const file of files) {
  const sql = fs.readFileSync(`docs/sprint-2c/generated/${file}`, "utf8");
  try {
    db.exec(sql);
    ok.push(file);
  } catch (e) {
    fail.push({ file, error: e.message });
  }
}

console.log(`\n=== TEST SQLITE (FK ON) ===`);
console.log(`OK: ${ok.length}/${files.length}`);
if (fail.length) {
  console.log(`\nEchecs: ${fail.length}`);
  fail.forEach(f => console.log(`  FAIL ${f.file} -> ${f.error}`));
}

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log(`\nTables reellement creees: ${tables.length}`);

const fkIssues = db.pragma("foreign_key_check");
console.log(`\nProblemes d'integrite FK: ${fkIssues.length}`);
if (fkIssues.length) console.log(fkIssues);

db.close();
