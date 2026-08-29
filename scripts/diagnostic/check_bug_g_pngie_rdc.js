const {Client} = require('pg');
const c = new Client({connectionString: 'postgresql://pngie_app:' + encodeURIComponent(':NI=CcM#D.jL(i#ni1v&[^qU') + '@localhost:5432/pngie_rdc'});
c.connect()
  .then(() => c.query("SELECT policyname, qual FROM pg_policies WHERE tablename='personne_role'"))
  .then(r => { console.log(JSON.stringify(r.rows, null, 2)); c.end(); })
  .catch(e => { console.error('ERREUR:', e.message); c.end(); });
