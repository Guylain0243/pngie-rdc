const axios = require("axios");
const base = "http://localhost:4000/api";

(async () => {
  const password = process.env.PNGIE_TEST_PASSWORD;
  const login = await axios.post(base + "/auth/login", { email: "test-mi@pngie.local", password });
  const token = login.data.token || login.data.accessToken;

  console.log("===== Forme brute de la reponse GET /affectations =====");
  try {
    const r = await axios.get(base + "/affectations", { headers: { Authorization: "Bearer " + token } });
    console.log("Statut:", r.status);
    console.log("Corps complet:", JSON.stringify(r.data, null, 2).slice(0, 1000));
  } catch (e) {
    console.log("ERREUR - Statut:", e.response ? e.response.status : e.message);
    console.log("Reponse:", e.response ? JSON.stringify(e.response.data) : "");
  }
  process.exit(0);
})();
