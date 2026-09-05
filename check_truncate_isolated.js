const db = require('./src/db');
const requestContext = require('./src/request-context');
(async () => {
  await requestContext.run({ bypassRls: true }, async () => {
    const before = await db.get('SELECT count(*) AS n FROM institution');
    console.log('AVANT TRUNCATE - lignes institution :', before.n);

    await db.run('TRUNCATE TABLE institution RESTART IDENTITY CASCADE');
    console.log('TRUNCATE exécuté sans erreur.');

    const after = await db.get('SELECT count(*) AS n FROM institution');
    console.log('APRES TRUNCATE - lignes institution :', after.n);
  });
  await db.close();
})().catch(e => { console.error('Erreur TRUNCATE isolé:', e); process.exit(1); });
