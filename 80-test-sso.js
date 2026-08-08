const http = require("http");

function req(options, body) {
  return new Promise((resolve, reject) => {
    const r = http.request(options, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    r.on("error", reject);
    if (body) r.write(body);
    r.end();
  });
}

async function main() {
  console.log("--- TEST 1 : route publique sans token ---");
  const pubRes = await req({
    hostname: "localhost", port: 4000, path: "/api/public/institutions", method: "GET"
  });
  console.log("GET /api/public/institutions -> statut", pubRes.status);
  const pubData = JSON.parse(pubRes.body);
  const types = Object.keys(pubData);
  const total = types.reduce((sum, t) => sum + pubData[t].length, 0);
  console.log("   types trouves:", types.length, "| total institutions:", total);

  console.log("--- LOGIN ---");
  const loginBody = JSON.stringify({ email: "test.finances@rdc.gouv.cd", password: "Test#2027" });
  const loginRes = await req({
    hostname: "localhost", port: 4000, path: "/api/auth/login", method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(loginBody) }
  }, loginBody);
  const loginData = JSON.parse(loginRes.body);
  const token = loginData.token;
  const roleCode = loginData.roles[0].code;
  console.log("0. Login -> statut", loginRes.status);

  console.log("--- TEST 2 : /api/me/poste ---");
  const meResp = await req({
    hostname: "localhost", port: 4000, path: "/api/me/poste", method: "GET",
    headers: { "Authorization": "Bearer " + token, "x-role-code": roleCode }
  });
  console.log("GET /api/me/poste -> statut", meResp.status);
  console.log(meResp.body);

  console.log("--- TEST 3 : /api/institutions/:id/dashboard ---");
  const firstType = types[0];
  const firstInst = pubData[firstType][0];
  const dashResp = await req({
    hostname: "localhost", port: 4000, path: "/api/institutions/" + firstInst.institution_id + "/dashboard", method: "GET",
    headers: { "Authorization": "Bearer " + token, "x-role-code": roleCode }
  });
  console.log("Institution testee:", firstInst.nom);
  console.log("GET /api/institutions/:id/dashboard -> statut", dashResp.status);
  console.log(dashResp.body.substring(0, 800));

  process.exit(0);
}

main().catch(err => { console.error("ERREUR FATALE:", err.message); process.exit(1); });