const axios = require("axios");
const base = "http://localhost:4000/api";

async function login(email, password) {
  const r = await axios.post(base + "/auth/login", { email, password });
  return r.data.token || r.data.accessToken;
}

(async () => {
  const password = process.env.PNGIE_TEST_PASSWORD;
  const tokenMI = await login("test-mi@pngie.local", password);
  const tokenPR = await login("test-pr@pngie.local", password);

  console.log("===== 4. Creation d un agent MI dans son propre perimetre - DOIT reussir (201) =====");
  const resArboMI = await axios.get(base + "/postes/arborescence", { headers: { Authorization: "Bearer " + tokenMI } });
  const instMI = resArboMI.data[0];
  console.log("Institution ciblee: " + (instMI ? instMI.nom : "AUCUNE"));
  let agentMIId = null;
  if (instMI) {
    try {
      const r = await axios.post(base + "/agents-rh", {
        nom: "TestScope", prenom: "Agent", date_naissance: "1990-01-01",
        matricule: "TESTSCOPE01", sexe: "M", institution_id: instMI.institution_id
      }, { headers: { Authorization: "Bearer " + tokenMI } });
      console.log("Statut: " + r.status + " (attendu 201)");
      agentMIId = r.data.data.agent_id;
    } catch (e) {
      console.log("Statut: " + (e.response ? e.response.status : e.message) + " - " + (e.response ? JSON.stringify(e.response.data) : ""));
    }
  }

  console.log("`n===== 5. MI relit son propre agent qu il vient de creer - DOIT reussir (200) =====");
  if (agentMIId) {
    try {
      const r = await axios.get(base + "/agents-rh/" + agentMIId, { headers: { Authorization: "Bearer " + tokenMI } });
      console.log("Statut: " + r.status + " - acces reussi (attendu)");
    } catch (e) {
      console.log("PROBLEME: " + (e.response ? e.response.status : e.message));
    }
  }

  console.log("`n===== 6. PR tente de lire ce meme agent (institution dans son perimetre national) =====");
  if (agentMIId) {
    try {
      const r = await axios.get(base + "/agents-rh/" + agentMIId, { headers: { Authorization: "Bearer " + tokenPR } });
      console.log("Statut: " + r.status + " (attendu 200 - PR a une portee nationale)");
    } catch (e) {
      console.log("Statut: " + (e.response ? e.response.status : e.message) + " - " + (e.response ? JSON.stringify(e.response.data) : ""));
    }
  }

  console.log("`n===== 7. MI tente de creer un agent sur une institution hors perimetre - DOIT renvoyer 403 =====");
  const resArboPR = await axios.get(base + "/postes/arborescence", { headers: { Authorization: "Bearer " + tokenPR } });
  const instPresidence = resArboPR.data.find(i => i.nom.includes("sidence"));
  if (instPresidence) {
    try {
      const r = await axios.post(base + "/agents-rh", {
        nom: "TestHorsPerimetre", prenom: "Agent", date_naissance: "1990-01-01",
        matricule: "TESTHP01", sexe: "M", institution_id: instPresidence.institution_id
      }, { headers: { Authorization: "Bearer " + tokenMI } });
      console.log("PROBLEME : statut " + r.status + " - creation reussie alors qu elle devrait etre bloquee");
    } catch (e) {
      console.log("Statut recu: " + (e.response ? e.response.status : e.message));
      console.log("Reponse: " + (e.response ? JSON.stringify(e.response.data) : ""));
    }
  }

  console.log("`n===== 8. MI tente de LIRE cet agent hors perimetre (cree par PR au test 7 si echoue, sinon skip) =====");
  console.log("(couvert par le test 7 - si bloque en creation, rien a lire)");

  process.exit(0);
})().catch(e => { console.error("ERREUR FATALE:", e.message); process.exit(1); });
