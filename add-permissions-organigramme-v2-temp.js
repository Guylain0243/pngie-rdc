const db = require("./src/db");
(async () => {
  const roles = ["AN", "GV", "MI", "PM", "PR", "SN"];
  for (const code of roles) {
    const role = await db.get("SELECT role_id FROM role WHERE code = ?", [code]);
    if (!role) { console.log(code + " : role introuvable"); continue; }
    const exists = await db.get(
      `SELECT permission_id FROM permission WHERE role_id = ? AND entite = ? AND action = ? AND statut = ?`,
      [role.role_id, "unite_organisationnelle", "READ", "ACTIF"]
    );
    if (exists) {
      console.log(code + " a deja unite_organisationnelle/READ");
    } else {
      await db.run(
        `INSERT INTO permission (role_id, entite, action, statut) VALUES (?, ?, ?, ?)`,
        [role.role_id, "unite_organisationnelle", "READ", "ACTIF"]
      );
      console.log(code + " -> unite_organisationnelle/READ ajoute");
    }
  }
  process.exit(0);
})();
