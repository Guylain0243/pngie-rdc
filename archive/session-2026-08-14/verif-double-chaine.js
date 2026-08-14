const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await c.connect();

  console.log("=== Chaine ANGLAISE (assignment/position/unit) pour gv@ et mi@ ===");
  const r1 = await c.query(`
    SELECT p.email, pos.titre, u.nom AS unit_nom, u.organization_id, o.nom AS institution_nom
    FROM person p
    JOIN assignment a ON a.person_id = p.person_id AND a.statut = 'ACTIF'
    JOIN position pos ON pos.position_id = a.position_id
    JOIN unit u ON u.unit_id = pos.unit_id
    LEFT JOIN organization o ON o.organization_id = u.organization_id
    WHERE p.email IN ('gv@rdc.gouv.cd','mi@rdc.gouv.cd')
  `);
  console.table(r1.rows);

  console.log("\n=== Chaine FRANCAISE (affectation/poste/unite_organisationnelle) pour gv@ et mi@ ===");
  const r2 = await c.query(`
    SELECT p.email, po.intitule, uo.nom AS unite_nom, uo.institution_id
    FROM person p
    JOIN affectation a ON a.personne_id = p.person_id AND a.statut = 'ACTIF' AND a.date_fin IS NULL
    JOIN poste po ON po.poste_id = a.poste_id
    JOIN unite_organisationnelle uo ON uo.unite_id = po.unite_id
    WHERE p.email IN ('gv@rdc.gouv.cd','mi@rdc.gouv.cd')
  `);
  console.table(r2.rows);

  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
