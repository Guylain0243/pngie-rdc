const db = require('./src/db');
db.get("SELECT current_user, session_user")
  .then(r => console.log('utilisateur connecte:', JSON.stringify(r)))
  .catch(e => console.log('ERREUR:', e.message));
