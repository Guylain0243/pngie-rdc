const db = require('./src/db');
db.all("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE (table_name='meta_entity' AND column_name='entity_id') OR (table_name='meta_attribute' AND column_name IN ('entity_id','attribute_id'))")
  .then(r => console.log('types:', JSON.stringify(r, null, 2)))
  .catch(e => console.log('ERREUR:', e.message));
