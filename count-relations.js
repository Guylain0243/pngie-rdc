const db = require('./src/db');
db.get("SELECT COUNT(*) as n FROM relations")
  .then(r => { console.log('relations:', JSON.stringify(r)); process.exit(0); })
  .catch(e => { console.error('Erreur:', e.message); process.exit(1); });