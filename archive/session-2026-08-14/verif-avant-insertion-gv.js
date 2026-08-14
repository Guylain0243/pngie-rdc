const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await c.connect();

  console.log("=== Confirmation: l'unite du poste Gouverneur de Kinshasa appartient bien a l'institution Kinshasa ===");
  const check = await c.query(`
    SELECT po.poste_id, po.intitule, uo.unite_id, uo.nom AS unite_nom, uo.institution_id, i.nom AS institution_nom
    FROM poste po
    JOIN unite_organisationnelle uo ON uo.unite_id = po.unite_id
    LEFT JOIN institution i ON i.institution_id = uo.institution_id
    WHERE po.poste_id = '2fc5f5e8-3ddd-4090-83f2-578b2481860a'
  `);
  console.table(check.rows);

  console.log("\n=== Verification: gv@ a-t-il deja une affectation existante (active ou non) ? ===");
  const existing = await c.query(`
    SELECT a.* FROM affectation a
    JOIN person p ON p.person_id = a.personne_id
    WHERE p.email = 'gv@rdc.gouv.cd'
  `);
  console.table(existing.rows);

  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
