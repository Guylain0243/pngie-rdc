const axios = require("axios");

async function testCompte(role, email, password, base) {
  try {
    const login = await axios.post(base + "/auth/login", { email, password });
    const token = login.data.token || login.data.accessToken;
    if (!token) { console.log(role + " : login OK mais pas de token - " + JSON.stringify(login.data)); return; }
    const headers = { Authorization: "Bearer " + token };
    const res = await axios.get(base + "/postes/arborescence", { headers });
    console.log(role + " : " + res.data.length + " institutions visibles");
  } catch (e) {
    console.log(role + " : ECHEC");
    console.log("  code:", e.code || "aucun");
    console.log("  statut HTTP:", e.response ? e.response.status : "aucun");
    console.log("  reponse:", e.response ? JSON.stringify(e.response.data) : e.message);
  }
}

(async () => {
  const base = "http://localhost:4000/api";
  const password = process.env.PNGIE_TEST_PASSWORD;
  await testCompte("MI", "test-mi@pngie.local", password, base);
  await testCompte("PM", "test-pm@pngie.local", password, base);
  await testCompte("PR", "test-pr@pngie.local", password, base);
  process.exit(0);
})();
