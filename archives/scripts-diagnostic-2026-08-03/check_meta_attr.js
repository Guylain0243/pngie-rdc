const db = require('./src/db');
db.all('SELECT count(*) as n FROM meta_attribute')
  .then(r => console.log('meta_attribute count:', JSON.stringify(r)))
  .catch(e => console.log('ERREUR:', e.message));
