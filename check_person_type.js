const db = require('./src/db');
const requestContext = require('./src/request-context');
(async () => {
  await requestContext.run({ bypassRls: true }, async () => {
    const info = await db.get(`SELECT table_name, table_type FROM information_schema.tables WHERE table_name = 'person'`);
    console.log('Nature de person :', JSON.stringify(info, null, 2));
  });
  await db.close();
})().catch(e => { console.error('Erreur:', e); process.exit(1); });
