const axios = require("axios");

async function testCompte(email, password, base) {
  console.log("`n===== " + email + " =====");
  try {
    const login = await axios.post(base + "/auth/login", { email, password });
    const token = login.data.token || login.data.accessToken;
    if (!token) { console.log("Login OK mais pas de token dans la reponse:", JSON.stringify(login.data)); return; }
    const headers = { Authorization: "Bearer " + token };

    const res = await axios.get(base + "/postes/arborescence", { headers });
    const institutions = res.data.map(i => i.nom);
    console.log("Statut: " + res.status + " - Institutions visibles (" + institutions.length + "): ");
    console.log(institutions.slice(0, 10).map(n => "  - " + n).join("`n"));
    if (institutions.length > 10) console.log("  ... et " + (institutions.length - 10) + " de plus");
  } catch (e) {
    console.log("ERREUR: " + (e.response ? e.response.status + " - " + JSON.stringify(e.response.data) : e.message));
  }
}

(async () => {
  const base = "http://localhost:4000/api";
  const password = process.env.PNGIE_TEST_PASSWORD;
  await testCompte("test-mi@pngie.local", password, base);
  await testCompte("test-pr@pngie.local", password, base);
  process.exit(0);
})();
