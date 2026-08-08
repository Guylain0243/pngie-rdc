const db = require("./src/db");
db.all("SELECT * FROM role_permission WHERE entity = 'ordre_paiement'")
  .then(rows => console.log(JSON.stringify(rows, null, 2)))
  .catch(err => {
    console.log("Table role_permission absente, essai autre nom...");
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%permission%'")
      .then(rows => console.log(JSON.stringify(rows, null, 2)))
      .catch(e => console.error("ERREUR:", e.message));
  });
