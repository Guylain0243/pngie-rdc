const db = require("./src/db");
db.all("SELECT * FROM meta_permission WHERE entity = 'ordre_paiement'")
  .then(rows => console.log(JSON.stringify(rows, null, 2)))
  .catch(err => console.error("ERREUR:", err.message));
