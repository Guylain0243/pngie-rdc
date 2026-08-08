const db = require("./src/db");
(async () => {
  const roles = ["PM", "PR"];
  for (const code of roles) {
    const role = await db.get("SELECT role_id FROM role WHERE code = ?", [code]);
    const exists = await db.get(
      `SELECT permission_id FROM permission WHERE role_id = ? AND entite = ? AND action = ? AND statut = ?`,
      [role.role_id, "agent", "READ", "ACTIF"]
    );
    if (exists) {
      console.log(code + " a deja agent/READ");
    } else {
      await db.run(`INSERT INTO permission (role_id, entite, action, statut) VALUES (?, ?, ?, ?)`, [role.role_id, "agent", "READ", "ACTIF"]);
      console.log(code + " -> agent/READ ajoute");
    }
  }
  process.exit(0);
})();
