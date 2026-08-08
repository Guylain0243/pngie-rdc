const http = require("http");
function req(opts, body) {
  return new Promise((resolve, reject) => {
    const r = http.request(opts, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    r.on("error", reject);
    if (body) r.write(body);
    r.end();
  });
}
(async () => {
  const loginBody = JSON.stringify({ email: "test.finances@rdc.gouv.cd", password: "TestFinances2026!" });
  const r0 = await req({ hostname: "localhost", port: 4000, path: "/api/auth/login", method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(loginBody) } }, loginBody);
  const token = JSON.parse(r0.body).token;
  console.log("LOGIN status:", r0.status);

  const db = require("./src/db");
  const inst = await db.get("SELECT institution_id FROM institution LIMIT 1");

  let r = await req({ hostname: "localhost", port: 4000, path: "/api/agents-rh", method: "GET", headers: { "Authorization": "Bearer " + token } });
  console.log("1. LISTE avant (doit etre []):", r.status, r.body.substring(0, 150));

  const createBody = JSON.stringify({
    nom: "Kabila", prenom: "Test", date_naissance: "1985-03-15", matricule: "AG-000001",
    sexe: "M", institution_id: inst.institution_id, statut: "ACTIF"
  });
  r = await req({ hostname: "localhost", port: 4000, path: "/api/agents-rh", method: "POST", headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(createBody) } }, createBody);
  console.log("2. CREATION:", r.status, r.body.substring(0, 250));
  const parsed = JSON.parse(r.body);
  const agentId = parsed.data ? parsed.data.agent_id : null;
  if (!agentId) { console.log("PAS D'AGENT CREE - arret"); return; }

  r = await req({ hostname: "localhost", port: 4000, path: "/api/agents-rh/" + agentId, method: "GET", headers: { "Authorization": "Bearer " + token } });
  console.log("3. DETAIL:", r.status, r.body.substring(0, 150));

  const updateBody = JSON.stringify({
    nom: "Kabila", prenom: "TestModifie", date_naissance: "1985-03-15", matricule: "AG-000001",
    sexe: "M", institution_id: inst.institution_id, statut: "SUSPENDU"
  });
  r = await req({ hostname: "localhost", port: 4000, path: "/api/agents-rh/" + agentId, method: "PUT", headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(updateBody) } }, updateBody);
  console.log("4. MODIFICATION:", r.status, r.body.substring(0, 150));

  r = await req({ hostname: "localhost", port: 4000, path: "/api/agents-rh/" + agentId + "/historique", method: "GET", headers: { "Authorization": "Bearer " + token } });
  console.log("5. HISTORIQUE:", r.status, r.body.substring(0, 150));

  r = await req({ hostname: "localhost", port: 4000, path: "/api/agents-rh/" + agentId, method: "DELETE", headers: { "Authorization": "Bearer " + token } });
  console.log("6. SUPPRESSION:", r.status);

  r = await req({ hostname: "localhost", port: 4000, path: "/api/agents-rh/" + agentId, method: "GET", headers: { "Authorization": "Bearer " + token } });
  console.log("7. DETAIL apres suppression (doit etre 404):", r.status);

  r = await req({ hostname: "localhost", port: 4000, path: "/api/agents", method: "GET", headers: { "Authorization": "Bearer " + token } });
  console.log("8. VERIF /api/agents (IA) intact:", r.status, r.body.substring(0, 100));
})();
