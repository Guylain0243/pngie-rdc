const db = require('./src/db');
(async () => {
  try {
    const p = await db.get('SELECT * FROM personne WHERE email = ? AND statut = ?', ['pr@rdc.gouv.cd', 'ACTIF']);
    console.log('Resultat personne:', p);
  } catch (e) {
    console.error('ERREUR:', e);
  }
})();
