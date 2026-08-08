const db = require("./src/db");
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
  const loginBody = JSON.stringify({ email: "test.finances@rdc.gouv.cd", password: "Test#2027" });
  const loginRes = await req({
    hostname: "localhost", port: 4000, path: "/api/auth/login", method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(loginBody) }
  }, loginBody);
  const loginData = JSON.parse(loginRes.body);
  const token = loginData.token;
  const roleCode = loginData.roles[0].code;

  const payload = JSON.stringify({
    source_entity: "ordre_paiement",
    source_id: "f90a3f33-6391-4833-9ff0-c66718156fac",
    relation: "concerne_institution",
    target_entity: "institution",
    target_id: "caa61add-1ff7-4021-8913-ae1b46f1f0bd"
  });

  const createRes = await req({
    hostname: "localhost", port: 4000, path: "/api/relations", method: "POST",
    headers: {
      "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload),
      "Authorization": "Bearer " + token, "x-role-code": roleCode
    }
  }, payload);
  console.log("1. Creation relation -> statut", createRes.status);
  console.log("   " + createRes.body);

  const listRes = await req({
    hostname: "localhost", port: 4000,
    path: "/api/entities/ordre_paiement/f90a3f33-6391-4833-9ff0-c66718156fac/relations",
    method: "GET",
    headers: { "Authorization": "Bearer " + token, "x-role-code": roleCode }
  });
  console.log("2. Consultation relations -> statut", listRes.status);
  console.log("   " + listRes.body);
}

main().catch(err => console.error("ERREUR FATALE:", err.message));
