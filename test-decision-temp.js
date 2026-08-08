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
  const institutions = await db.all("SELECT institution_id, nom FROM institution LIMIT 2");
  console.log("Institutions utilisees:", institutions.map(i => i.nom).join(", "));

  const createBody = JSON.stringify({
    emetteur_institution_id: institutions[0].institution_id,
    titre: "Renforcer la digitalisation des services publics",
    description: "Orientation presidentielle 2026",
    date_emission: "2026-08-03",
    institutions_concernees: institutions.map(i => i.institution_id).join(","),
    date_echeance: "2026-12-31"
  });
  let r = await req({ hostname: "localhost", port: 4000, path: "/api/decisions", method: "POST", headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(createBody) } }, createBody);
  console.log("1. CREATION decision:", r.status, r.body.substring(0, 300));
  const decision = JSON.parse(r.body).data;
  if (!decision) { console.log("PAS DE DECISION CREEE - arret"); return; }

  r = await req({ hostname: "localhost", port: 4000, path: "/api/decisions/" + decision.decision_id, method: "GET", headers: { "Authorization": "Bearer " + token } });
  console.log("2. DETAIL avec actions:", r.status, r.body.substring(0, 500));
  const detail = JSON.parse(r.body).data;
  const premiereAction = detail.actions[0];

  const updateBody = JSON.stringify({ statut: "EN_COURS", taux_execution: 45, commentaire: "Phase de deploiement lancee" });
  r = await req({ hostname: "localhost", port: 4000, path: "/api/decisions/actions/" + premiereAction.action_id, method: "PUT", headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(updateBody) } }, updateBody);
  console.log("3. MISE A JOUR action:", r.status, r.body.substring(0, 250));

  r = await req({ hostname: "localhost", port: 4000, path: "/api/decisions/" + decision.decision_id + "/tableau-bord", method: "GET", headers: { "Authorization": "Bearer " + token } });
  console.log("4. TABLEAU DE BORD:", r.status, r.body.substring(0, 400));

  r = await req({ hostname: "localhost", port: 4000, path: "/api/decisions", method: "GET", headers: { "Authorization": "Bearer " + token } });
  console.log("5. LISTE:", r.status, r.body.substring(0, 200));
})();
