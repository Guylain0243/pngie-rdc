const Database = require("better-sqlite3");
const fs = require("fs");
const db = new Database("docs/sprint-2c/schema-test.db");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(t => t.name);
fs.writeFileSync("docs/sprint-2c/tables-reelles.txt", tables.join("\n"));
db.close();
