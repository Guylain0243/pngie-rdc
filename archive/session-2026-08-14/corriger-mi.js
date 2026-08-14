const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await c.connect();
  const res = await c.query(
    `UPDATE person_role SET scope_org_id = $1
     WHERE person_id = (SELECT person_id FROM person WHERE email = $2)`,
    ["caa61add-1ff7-4021-8913-ae1b46f1f0bd", "mi@rdc.gouv.cd"]
  );
  console.log(`mi@rdc.gouv.cd -> scope_org_id mis a jour vers "Finances" (${res.rowCount} ligne(s) affectee(s))`);
  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
