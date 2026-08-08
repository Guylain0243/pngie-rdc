const db = require('./src/db');
(async () => {
  const agentsParInstitution = await db.all("SELECT i.code, COUNT(a.agent_id) AS nb_agents FROM institution i LEFT JOIN agent a ON a.institution_id = i.institution_id GROUP BY i.code HAVING COUNT(a.agent_id) > 0 ORDER BY i.code");
  console.log('--- Agents par institution ---');
  console.table(agentsParInstitution);
  process.exit();
})();
