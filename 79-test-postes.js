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

  console.log("0. Login -> statut", loginRes.status);

  const posteId = "df9e5b88-0bff-4457-be3e-9af4c01d9157";
  console.log("   poste_id de test (institution Affaires Etrangeres):", posteId);

  const envRes = await req({
    hostname: "localhost", port: 4000, path: "/api/postes/" + posteId + "/environnement", method: "GET",
    headers: { "Authorization": "Bearer " + token, "x-role-code": roleCode }
  });
  console.log("2. Environnement du poste -> statut", envRes.status);

  const data = JSON.parse(envRes.body);
  console.log("   institution:", data.poste.institution);
  console.log("   nombre de documents_institution:", data.documents_institution.length);
  console.log("   documents_institution:", JSON.stringify(data.documents_institution));

  process.exit(0);
}

main().catch(err => { console.error("ERREUR FATALE:", err.message); process.exit(1); });