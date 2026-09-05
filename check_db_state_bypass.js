const db = require('./src/db');
const requestContext = require('./src/request-context');
(async () => {
  const result = await requestContext.run({ bypassRls: true }, async () => {
    const count = await db.get('SELECT count(*) AS n FROM institution');
    const presidence = await db.all(`SELECT institution_id, code, nom FROM institution WHERE code = 'PRESIDENCE'`);
    return { count, presidence };
  });
  console.log('Avec bypass RLS - Nombre de lignes :', result.count.n);
  console.log('Avec bypass RLS - Lignes PRESIDENCE :', JSON.stringify(result.presidence, null, 2));
  await db.close();
})().catch(e => { console.error('Erreur:', e); process.exit(1); });
