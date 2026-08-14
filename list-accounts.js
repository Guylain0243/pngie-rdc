const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await c.connect();
  const r = await c.query("SELECT p.email, r.code, r.nom FROM person p JOIN person_role pr ON pr.person_id = p.person_id JOIN role r ON r.role_id = pr.role_id ORDER BY r.code LIMIT 30");
  console.table(r.rows);
  await c.end();
}

main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
