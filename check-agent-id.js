const db = require('./src/db');
(async () => {
  const agent = await db.get("SELECT agent_id, nom, prenom, institution_id FROM agent LIMIT 1");
  console.log(JSON.stringify(agent, null, 2));
  process.exit();
})();
