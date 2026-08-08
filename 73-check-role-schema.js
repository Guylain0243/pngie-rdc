const db = require("./src/db");

async function main() {
  for (const table of ["role", "person_role", "person"]) {
    try {
      console.log("=== " + table + " ===");
      const cols = await db.all(`PRAGMA table_info(${table})`);
      console.log(cols.map(c => c.name).join(", "));
    } catch (e) {
      console.log("(table " + table + " absente ou erreur: " + e.message + ")");
    }
  }
}

main().catch(err => console.error("ERREUR:", err.message));
