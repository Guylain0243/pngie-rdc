const db = require("./src/db");
(async () => {
  const roles = ["PM", "PR"];
  const actions = ["READ"];
  for (const code of roles) {
    const role = await db.get("SELECT role_id FROM role WHERE code = ?", [code]);
    for (const action of actions) {
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
  }
  process.exit(0);
})();
