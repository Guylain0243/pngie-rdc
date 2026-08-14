const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await c.connect();
  const r = await c.query(`
    SELECT p.email, p.nom, p.prenom, r.code AS role_code, r.nom AS role_nom
    FROM person p
    LEFT JOIN person_role pr ON pr.person_id = p.person_id
    LEFT JOIN role r ON r.role_id = pr.role_id
    ORDER BY r.code NULLS LAST, p.email
  `);
  console.log('Total comptes:', r.rows.length);
  console.log('');
  for (const row of r.rows) {
    console.log(`${row.role_code || '(aucun rôle)'} | ${row.email} | ${row.prenom || ''} ${row.nom || ''} | mot de passe: Pngie#2027`);
  }
  await c.end();
}
main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
