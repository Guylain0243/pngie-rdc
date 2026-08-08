const { execFileSync } = require('child_process');
const db = require('./src/db');

(async () => {
  const entites = await db.all(`
    SELECT DISTINCT me.nom_table
    FROM meta_entity me
    JOIN meta_attribute ma ON ma.entity_id = me.entity_id
    ORDER BY me.nom_table
  `);

  console.log(`=== ${entites.length} entites a regenerer ===\n`);

  const succes = [];
  const echecs = [];

  for (const { nom_table } of entites) {
    try {
      const out = execFileSync('node', ['government-builder.js', nom_table], { encoding: 'utf8' });
      console.log(`OK  - ${nom_table}`);
      succes.push(nom_table);
    } catch (err) {
      console.log(`FAIL - ${nom_table} : ${err.message.split('\n')[0]}`);
      echecs.push({ table: nom_table, erreur: err.message });
    }
  }

  console.log(`\n=== RESUME ===`);
  console.log(`Succes : ${succes.length}/${entites.length}`);
  console.log(`Echecs : ${echecs.length}`);
  if (echecs.length > 0) {
    console.log('\nDetail des echecs :');
    echecs.forEach(e => console.log(`  - ${e.table}: ${e.erreur.split('\n')[0]}`));
  }

  await db.close();
})().catch(e => { console.error('ERREUR FATALE:', e.message); process.exitCode = 1; });
