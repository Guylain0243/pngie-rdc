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

  const endpoints = [
    "/api/signalement_sanitaires", "/api/bien_patrimonials", "/api/appel_offress", "/api/etude_impact_environnementals",
    "/api/postes/arborescence", "/api/institutions/liste", "/api/me/poste", "/api/institutions/00000000-0000-0000-0000-000000000000/fiche-complete"
  ];

  let ok = 0, other = 0;
  for (const ep of endpoints) {
    const r = await req({ hostname: "localhost", port: 4000, path: ep, method: "GET", headers: { "Authorization": "Bearer " + token } });
    const isOk = r.status === 200 || r.status === 404 && ep.includes("00000000"); // 404 attendu pour un ID bidon
    console.log(ep, "-> status:", r.status, isOk ? "(OK)" : "(A VERIFIER)", "| body:", r.body.substring(0, 100));
  }
})();
