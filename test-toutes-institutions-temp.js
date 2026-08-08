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
  const institutions = await db.all("SELECT institution_id, nom FROM institution");
  console.log("Nombre total d'institutions dans le systeme:", institutions.length);

  const emetteur = institutions.find(i => i.nom.includes("Pr") && i.nom.includes("sidence")) || institutions[0];
  const createBody = JSON.stringify({
    emetteur_institution_id: emetteur.institution_id,
    titre: "Decision test - couverture nationale complete",
    description: "Verification que toutes les institutions sont bien assignables",
    date_emission: "2026-08-03",
    institutions_concernees: institutions.map(i => i.institution_id).join(","),
    date_echeance: "2026-12-31"
  });

  const r = await req({ hostname: "localhost", port: 4000, path: "/api/decisions", method: "POST", headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(createBody) } }, createBody);
  console.log("CREATION (toutes institutions) status:", r.status);
  const parsed = JSON.parse(r.body);
  if (r.status !== 201) { console.log("ECHEC:", r.body.substring(0, 500)); return; }

  const decisionId = parsed.data.decision_id;
  const actions = await db.all("SELECT institution_id FROM decision_action WHERE decision_id = ?", [decisionId]);
  console.log("Actions creees:", actions.length, "/ Institutions attendues:", institutions.length);
  console.log("Correspondance parfaite:", actions.length === institutions.length);

  // Nettoyage : on retire ce test pour ne pas polluer les vraies decisions
  await db.run("DELETE FROM decision_action WHERE decision_id = ?", [decisionId]);
  await db.run("DELETE FROM decision_gouvernementale WHERE decision_id = ?", [decisionId]);
  console.log("Decision de test nettoyee.");
})();
