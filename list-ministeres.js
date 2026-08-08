const db = require("./src/db");
db.all("SELECT code, organization_id, nom FROM organization WHERE code LIKE 'MIN_%' ORDER BY CAST(SUBSTR(code,5) AS INTEGER)")
  .then(rows => {
    rows.forEach(r => console.log(r.code, r.organization_id, "-", r.nom));
    process.exit(0);
  })
  .catch(err => { console.error(err); process.exit(1); });
