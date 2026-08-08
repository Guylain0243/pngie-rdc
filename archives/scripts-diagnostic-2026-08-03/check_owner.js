const db = require('./src/db');
db.all("SELECT tablename, tableowner FROM pg_tables WHERE tablename IN ('meta_entity','meta_attribute')")
  .then(r => console.log('proprietaires:', JSON.stringify(r, null, 2)))
  .catch(e => console.log('ERREUR proprietaires:', e.message));
