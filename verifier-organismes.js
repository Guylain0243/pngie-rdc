const db = require('./src/db');

db.all(
  `SELECT o.nom, o.code, p.nom as parent
   FROM organization o
   JOIN organization p ON o.parent_id = p.organization_id
   WHERE o.type_id = 7
   ORDER BY p.nom, o.nom`
)
  .then(rows => {
    console.log(`--- ${rows.length} organisme(s) sous tutelle trouve(s) ---`);
    rows.forEach(r => console.log(`${r.parent} -> ${r.nom} (${r.code})`));
    process.exitCode = 0;
  })
  .catch(err => {
    console.error('ERREUR :', err.message);
    process.exitCode = 1;
  });
