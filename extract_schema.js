const Database = require("better-sqlite3");
const db = new Database("db\\pngie.db", { readonly: true });
const rows = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
let out = "";
for (const r of rows) {
    out += "-- " + r.name + "\n" + r.sql + "\n\n";
}
require("fs").writeFileSync("schema_sqlite.txt", out, "utf8");
console.log("OK, " + rows.length + " tables trouvees.");
db.close();