const db = require('./src/db');
const requestContext = require('./src/request-context');
(async () => {
  await requestContext.run({ bypassRls: true }, async () => {
    const tables = await db.all(`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`);
    console.log('Tables listées pour TRUNCATE :', tables.map(t => t.tablename).join(', '));
    const hasPersonne = tables.some(t => t.tablename === 'personne');
    console.log('personne incluse ?', hasPersonne);
  });
  await db.close();
})().catch(e => { console.error('Erreur:', e); process.exit(1); });
