const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await c.connect();

  console.log("=== Roles attribues a ace@ et mi@ ===");
  const r1 = await c.query(`
    SELECT p.email, r.code, r.nom, r.categorie
    FROM person p
    JOIN person_role pr ON pr.person_id = p.person_id
    JOIN role r ON r.role_id = pr.role_id
    WHERE p.email IN ('ace@rdc.gouv.cd','mi@rdc.gouv.cd')
    ORDER BY p.email
  `);
  console.table(r1.rows);

  console.log("\n=== Permissions accordees pour ligne_budgetaire / dossier_agent_rh ===");
  const r2 = await c.query(`
    SELECT r.code AS role_code, p.code AS permission_code
    FROM role_permission rp
    JOIN role r ON r.role_id = rp.role_id
    JOIN permission p ON p.permission_id = rp.permission_id
    WHERE p.code LIKE '%ligne_budgetaire%' OR p.code LIKE '%dossier_agent_rh%'
    ORDER BY p.code, r.code
  `);
  console.table(r2.rows);

  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
