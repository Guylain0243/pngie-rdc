const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await c.connect();
  const r = await c.query(`
    SELECT p.email, po.intitule, uo.nom AS unite_nom, uo.institution_id, i.nom AS institution_nom
    FROM person p
    JOIN affectation a ON a.personne_id = p.person_id AND a.statut = 'ACTIF' AND a.date_fin IS NULL
    JOIN poste po ON po.poste_id = a.poste_id
    JOIN unite_organisationnelle uo ON uo.unite_id = po.unite_id
    LEFT JOIN institution i ON i.institution_id = uo.institution_id
    WHERE p.email IN ('gv@rdc.gouv.cd','mi@rdc.gouv.cd')
  `);
  console.table(r.rows);
  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
