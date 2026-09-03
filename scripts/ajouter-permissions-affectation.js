// scripts/ajouter-permissions-affectation.js
// Complete les permissions sur l'entite "affectation" necessaires aux tests E2E 005 :
// MI (READ, CREATE, UPDATE, DELETE), PM (READ seul), PR (READ, deja national).
// Idempotent : ne duplique rien si la permission existe deja.
const db = require("../src/db");

const PERMISSIONS = [
  ["MI", "READ"], ["MI", "CREATE"], ["MI", "UPDATE"], ["MI", "DELETE"],
  ["PM", "READ"],
  ["PR", "READ"],
];

(async () => {
  for (const [code, action] of PERMISSIONS) {
    const role = await db.get("SELECT role_id FROM role WHERE code = ?", [code]);
    if (!role) { console.log(code + " : role introuvable, skip"); continue; }
    const exists = await db.get(
      `SELECT permission_id FROM permission WHERE role_id = ? AND entite = ? AND action = ? AND statut = ?`,
      [role.role_id, "affectation", action, "ACTIF"]
    );
    if (exists) {
      console.log(code + " a deja affectation/" + action);
    } else {
      await db.run(
        `INSERT INTO permission (role_id, entite, action, statut) VALUES (?, ?, ?, ?)`,
        [role.role_id, "affectation", action, "ACTIF"]
      );
      console.log(code + " -> affectation/" + action + " ajoute");
    }
  }
  process.exit(0);
})();