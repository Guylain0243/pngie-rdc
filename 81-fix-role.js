const db = require("./src/db");
(async () => {
  const p = await db.get("SELECT person_id FROM person WHERE email = ?", ["test.finances@rdc.gouv.cd"]);
  console.log("Person:", p);
  if (p) {
    const roles = await db.all("SELECT * FROM person_role WHERE person_id = ?", [p.person_id]);
    console.log("Roles actuels:", roles);
    if (roles.length === 0) {
      const role = await db.get("SELECT role_id FROM role WHERE code = 'MI'");
      await db.run("INSERT INTO person_role (person_role_id, person_id, role_id) VALUES (?, ?, ?)",
        [require("crypto").randomUUID(), p.person_id, role.role_id]);
      console.log("Role MI reattache.");
    }
  }
})().catch(e => console.log("ERREUR:", e.message));
