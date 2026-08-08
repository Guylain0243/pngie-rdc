const db = require('./src/db');
db.all("SELECT nom_table FROM meta_entity ORDER BY nom_table")
  .then(rows => { console.log(JSON.stringify(rows.map(r => r.nom_table), null, 2)); process.exit(0); })
  .catch(e => { console.error('Erreur:', e.message); process.exit(1); });