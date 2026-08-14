const { Client } = require('pg');
const c = new Client({ host:'127.0.0.1', port:5432, database:'pngie_rdc', user:'postgres' });

async function main() {
  await c.connect();
  console.log('Connecte en trust, OK');

  await c.query("ALTER USER postgres WITH PASSWORD 'Pngie2027Admin!'");
  console.log('Mot de passe postgres reinitialise');

  await c.query('GRANT SELECT ON ALL TABLES IN SCHEMA public TO pngie_app');
  console.log('Droits SELECT accordes sur toutes les tables/vues du schema public a pngie_app');

  await c.end();
}

main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
