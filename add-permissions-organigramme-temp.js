const db = require("./src/db");
(async () => {
  const roles = ["AN", "GV", "MI", "PM", "PR", "SN"];
  for (const role of roles) {
    const exists = await db.get(
      `SELECT permission_id FROM meta_permission WHERE role_code = ? AND entity = ? AND action = ? AND statut = ?`,
      [role, "unite_organisationnelle", "READ", "ACTIF"]
    );
    if (exists) {
      console.log(role + " a deja unite_organisationnelle/READ");
    } else {
      try {
        await db.run(
          `INSERT INTO meta_permission (role_code, entity, action, statut) VALUES (?, ?, ?, ?)`,
          [role, "unite_organisationnelle", "READ", "ACTIF"]
        );
        console.log(role + " -> unite_organisationnelle/READ ajoute");
      } catch (e) {
        console.log("ERREUR pour " + role + " : " + e.message);
      }
    }
  }
  process.exit(0);
})();
