const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });

const mappingsCertains = [
  { email: "an@rdc.gouv.cd", org_id: "34d8b135-def0-4b9b-92b8-76c58bed955d", nom: "Assemblee Nationale" },
  { email: "sn@rdc.gouv.cd", org_id: "59b51324-1791-4ccb-821c-08d3d38c0de7", nom: "Senat" },
  { email: "pr@rdc.gouv.cd", org_id: "f924e2ae-96c6-4b9e-81cc-d9602969ec3f", nom: "Presidence" },
  { email: "pm@rdc.gouv.cd", org_id: "ae011056-e941-4cb0-9504-9d1478324fc5", nom: "Primature" },
];

async function main() {
  await c.connect();
  for (const m of mappingsCertains) {
    const res = await c.query(
      `UPDATE person_role SET scope_org_id = $1
       WHERE person_id = (SELECT person_id FROM person WHERE email = $2)`,
      [m.org_id, m.email]
    );
    console.log(`${m.email} -> scope_org_id mis a jour vers "${m.nom}" (${res.rowCount} ligne(s) affectee(s))`);
  }
  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
