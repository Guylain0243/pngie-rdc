const db = require("./src/db");

async function main() {
  for (const table of ["permission", "role_permission", "meta_permission"]) {
    console.log("=== " + table + " ===");
    const cols = await db.all(`PRAGMA table_info(${table})`);
    console.log(cols.map(c => c.name).join(", "));
  }

  console.log("\n=== Permissions liees a ordre_paiement ===");
  const perms = await db.all("SELECT * FROM permission WHERE entity = 'ordre_paiement'");
  console.log(JSON.stringify(perms, null, 2));
}

main().catch(err => console.error("ERREUR:", err.message));
