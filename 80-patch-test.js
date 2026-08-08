const fs = require("fs");
let content = fs.readFileSync("77-test-complet-seuil.js", "utf8");

const oldBlock = `const personId = crypto.randomUUID();
  const hash = await bcrypt.hash("Test#2027", 10);
  await db.run(
    "INSERT INTO person (person_id, matricule, nom, prenom, email, password_hash, statut, created_at) VALUES (?, ?, ?, ?, ?, ?, 'ACTIF', ?)",
    [personId, "TEST-MI-001", "TestFinances", "Compte", "test.finances@rdc.gouv.cd", hash, new Date().toISOString()]
  );
  await db.run(
    "INSERT INTO person_role (person_role_id, person_id, role_id) VALUES (?, ?, ?)",
    [crypto.randomUUID(), personId, role.role_id]
  );
  console.log("1. Compte test MI cree");`;

const newBlock = `let existingP = await db.get("SELECT person_id FROM person WHERE email = ?", ["test.finances@rdc.gouv.cd"]);
  if (!existingP) {
    const personId = crypto.randomUUID();
    const hash = await bcrypt.hash("Test#2027", 10);
    await db.run(
      "INSERT INTO person (person_id, matricule, nom, prenom, email, password_hash, statut, created_at) VALUES (?, ?, ?, ?, ?, ?, 'ACTIF', ?)",
      [personId, "TEST-MI-001", "TestFinances", "Compte", "test.finances@rdc.gouv.cd", hash, new Date().toISOString()]
    );
    await db.run(
      "INSERT INTO person_role (person_role_id, person_id, role_id) VALUES (?, ?, ?)",
      [crypto.randomUUID(), personId, role.role_id]
    );
    console.log("1. Compte test MI cree");
  } else {
    console.log("1. Compte test MI deja existant, reutilise");
  }`;

if (!content.includes(oldBlock)) {
  console.log("ERREUR: bloc original introuvable, aucun changement applique.");
} else {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync("77-test-complet-seuil.js", content, "utf8");
  console.log("Patch applique avec succes.");
}
