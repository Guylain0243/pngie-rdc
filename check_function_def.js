const db = require('./src/db');
const requestContext = require('./src/request-context');
(async () => {
  await requestContext.run({ bypassRls: true }, async () => {
    const def = await db.get(`SELECT pg_get_functiondef('fn_organization_insert_instead'::regproc) AS def`);
    console.log(def.def);
  });
  await db.close();
})().catch(e => { console.error('Erreur:', e); process.exit(1); });
