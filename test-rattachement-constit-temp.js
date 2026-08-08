const axios = require("axios");
const base = "http://localhost:4000/api";

async function login(email, password) {
  const r = await axios.post(base + "/auth/login", { email, password });
  return r.data.token || r.data.accessToken;
}

(async () => {
  const password = process.env.PNGIE_TEST_PASSWORD;

  for (const role of ["mi", "pm", "pr"]) {
    const token = await login("test-" + role + "@pngie.local", password);
    const r = await axios.get(base + "/postes/arborescence", { headers: { Authorization: "Bearer " + token } });
    const noms = r.data.map(i => i.nom);
    const constit = noms.filter(n => ["CNDH", "Election", "Marchés Publics", "Économique", "Magistrature", "Audiovisuel", "Mediateur", "Médiateur"].some(k => n.includes(k)));
    console.log(role.toUpperCase() + " : " + r.data.length + " institution(s) au total, dont " + constit.length + " constitutionnelle(s): " + constit.join(", "));
  }
  process.exit(0);
})().catch(e => { console.error("ERREUR:", e.response ? e.response.status + " " + JSON.stringify(e.response.data) : e.message); process.exit(1); });
