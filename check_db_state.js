const db = require('./src/db');
(async () => {
  const count = await db.get('SELECT count(*) AS n FROM institution');
  console.log('Nombre de lignes institution :', count.n);

  const presidence = await db.all(`SELECT institution_id, code, nom FROM institution WHERE code = 'PRESIDENCE'`);
  console.log('Lignes PRESIDENCE :', JSON.stringify(presidence, null, 2));

  const activity = await db.all(`SELECT pid, state, query FROM pg_stat_activity WHERE datname = 'pngie_rdc_rls_test' AND pid <> pg_backend_pid()`);
  console.log('Connexions actives :', JSON.stringify(activity, null, 2));

  await db.close();
})().catch(e => { console.error('Erreur:', e); process.exit(1); });
