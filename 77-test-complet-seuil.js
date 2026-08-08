const db = require("./src/db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
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
  const role = await db.get("SELECT role_id FROM role WHERE code = 'MI'");
  if (!role) { console.log("ERREUR: role MI introuvable"); return; }

  let existingP = await db.get("SELECT person_id FROM person WHERE email = ?", ["test.finances@rdc.gouv.cd"]);
  if (!existingP) {
    const personId = crypto.randomUUID();
    const hash = await bcrypt.hash("Test#2027", 10);
    await db.run(
      "INSERT INTO person (person_id, matricule, nom, prenom, email, password_hash, statut, created_at) VALUES (?, ?, ?, ?, ?, ?, 'ACTIF', ?)",
      [personId, "TEST-MI-001", "TestFinances", "Compte", "test.finances@rdc.gouv.cd", hash, new Date().toISOString()]
    );
    await db.run(
      "INSERT INTO person_role (person_role_id, person_id, role_id) VALUES (?, ?, ?)",
      [crypto.randomUUID(), personId, role.role_id]
    );
    console.log("1. Compte test MI cree");
  } else {
    console.log("1. Compte test MI deja existant, reutilise");
  }

  const loginBody = JSON.stringify({ email: "test.finances@rdc.gouv.cd", password: "Test#2027" });
  const loginRes = await req({
    hostname: "localhost", port: 4000, path: "/api/auth/login", method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(loginBody) }
  }, loginBody);
  const loginData = JSON.parse(loginRes.body);
  if (!loginData.token) { console.log("2. ECHEC LOGIN:", loginRes.body); return; }
  const token = loginData.token;
  const roleCode = loginData.roles[0].code;
  console.log("2. Login OK, role:", roleCode);

  const orderId = crypto.randomUUID();
  await db.run(
    "INSERT INTO ordre_paiement (ordre_paiement_id, beneficiaire, montant, institution, statut) VALUES (?, ?, ?, ?, ?)",
    [orderId, "Test Fournisseur ABC", 15000, "Ministere des Finances", "EN_ATTENTE"]
  );
  console.log("3. Ordre de paiement 15000 USD cree:", orderId);

  function putOrder(body) {
    const payload = JSON.stringify(body);
    return req({
      hostname: "localhost", port: 4000, path: "/api/ordre_paiements/" + orderId, method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "Authorization": "Bearer " + token,
        "x-role-code": roleCode
      }
    }, payload);
  }

  const attempt1 = await putOrder({ statut: "PAYE" });
  console.log("4. Tentative de paiement SANS validation -> statut " + attempt1.status);
  console.log("   " + attempt1.body);

  const attempt2 = await putOrder({ valide_par_budget: "OUI" });
  console.log("5. Validation Budget -> statut " + attempt2.status);

  const attempt3 = await putOrder({ valide_par_finances: "OUI" });
  console.log("6. Validation Finances -> statut " + attempt3.status);

  const attempt4 = await putOrder({ valide_par_primature: "OUI" });
  console.log("7. Validation Primature -> statut " + attempt4.status);

  const attempt5 = await putOrder({ statut: "PAYE" });
  console.log("8. Tentative de paiement APRES les 3 validations (montant 15000 < 50000, pas besoin Presidence/IGF) -> statut " + attempt5.status);
  console.log("   " + attempt5.body);
}

main().catch(err => console.error("ERREUR FATALE:", err.message));

