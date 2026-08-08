const db = require("./src/db");
db.all(`
  SELECT p.person_id, p.nom, p.prenom, p.email, r.role_code, r.nom as role_nom
  FROM person p
  JOIN person_role pr ON pr.person_id = p.person_id
  JOIN role r ON r.role_code = pr.role_code
  WHERE r.role_code = 'MI'
  LIMIT 5
`)
  .then(rows => console.log(JSON.stringify(rows, null, 2)))
  .catch(err => console.error("ERREUR:", err.message));
