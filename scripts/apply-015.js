const { Client } = require('pg');
const fs = require('fs');
async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const sql = fs.readFileSync('db\\migrations\\015_seed_permissions_decision_gouvernementale.sql', 'utf8');
  await client.query(sql);
  console.log('OK : migration 015 appliquee');
  await client.end();
}
main().catch(e => { console.error('ERREUR :', e.message); process.exit(1); });
