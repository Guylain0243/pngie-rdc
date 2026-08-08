const https = require("http");

function requestJson(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const loginBody = JSON.stringify({ email: "pr@rdc.gouv.cd", password: "Pngie#2027" });
  const loginRes = await requestJson({
    hostname: "localhost", port: 4000, path: "/api/auth/login", method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(loginBody) }
  }, loginBody);

  console.log("LOGIN STATUS:", loginRes.status);
  const loginData = JSON.parse(loginRes.body);
  const token = loginData.token;
  const roleCode = loginData.roles[0].code;
  console.log("Token recupere (longueur):", token.length);
  console.log("Role:", roleCode);

  const putBody = JSON.stringify({ statut: "PAYE" });
  const putRes = await requestJson({
    hostname: "localhost", port: 4000, path: "/api/ordre_paiements/b2f4434c-f0b6-49b4-b62f-4933f6f25a9e", method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(putBody),
      "Authorization": "Bearer " + token,
      "x-role-code": roleCode
    }
  }, putBody);

  console.log("PUT STATUS:", putRes.status);
  console.log("PUT BODY:", putRes.body);
}

main().catch(err => { console.error(err); process.exit(1); });
