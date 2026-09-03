const { Client } = require('pg'); // ou le module que utilise assign-test-roles.js

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
    // adapte selon ce qui est utilisé dans assign-test-roles.js
  });
  await client.connect();

  const res = await client.query(`
    SELECT r.code AS role, e.code AS entite, p.action
    FROM meta_permission p
    JOIN meta_role r ON r.id = p.role_id
    JOIN meta_entite e ON e.id = p.entite_id
    WHERE e.code IN ('acte_officiel', 'journal_national', 'decision_gouvernementale', 'cockpit_indicateurs')
    ORDER BY e.code, r.code
  `);

  console.table(res.rows);
  await client.end();
}

main().catch(e => { console.error('ERREUR FATALE :', e.message); process.exit(1); });