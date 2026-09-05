const db = require('./src/db');
const requestContext = require('./src/request-context');
(async () => {
  await requestContext.run({ bypassRls: true }, async () => {
    const triggers = await db.all(`
      SELECT event_object_table, trigger_name, action_statement, action_timing, event_manipulation
      FROM information_schema.triggers
      WHERE event_object_table IN ('organization', 'institution')
    `);
    console.log('Triggers trouvés :', JSON.stringify(triggers, null, 2));
  });
  await db.close();
})().catch(e => { console.error('Erreur:', e); process.exit(1); });
