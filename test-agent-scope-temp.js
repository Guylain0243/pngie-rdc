const axios = require("axios");
const base = "http://localhost:4000/api";

async function login(email, password) {
  const r = await axios.post(base + "/auth/login", { email, password });
  return r.data.token || r.data.accessToken;
}

(async () => {
  const password = process.env.PNGIE_TEST_PASSWORD;

  console.log("===== 1. MI - liste des agents visibles =====");
  const tokenMI = await login("test-mi@pngie.local", password);
  const resListe = await axios.get(base + "/agents-rh", { headers: { Authorization: "Bearer " + tokenMI } });
  const listeMI = resListe.data.data;
  console.log("MI voit " + listeMI.length + " agent(s)");

  console.log("`n===== 2. PR - liste des agents visibles =====");
  const tokenPR = await login("test-pr@pngie.local", password);
  const resListePR = await axios.get(base + "/agents-rh", { headers: { Authorization: "Bearer " + tokenPR } });
  const listePR = resListePR.data.data;
  console.log("PR voit " + listePR.length + " agent(s)");

  console.log("`n===== 3. MI tente de lire un agent hors perimetre - DOIT renvoyer 403 =====");
  const cible = listePR.find(a => !listeMI.some(m => m.agent_id === a.agent_id));
  console.log("Agent cible: " + (cible ? cible.agent_id + " (" + cible.nom + " " + cible.prenom + ")" : "AUCUN trouve"));
  if (cible) {
    try {
      const r = await axios.get(base + "/agents-rh/" + cible.agent_id, { headers: { Authorization: "Bearer " + tokenMI } });
      console.log("PROBLEME : statut " + r.status + " - acces reussi alors qu il devrait etre bloque");
    } catch (e) {
      console.log("Statut recu: " + (e.response ? e.response.status : e.message));
      console.log("Reponse: " + (e.response ? JSON.stringify(e.response.data) : ""));
    }
  }

  console.log("`n===== 4. MI accede a SON PROPRE agent (si existant) - DOIT reussir (200) =====");
  if (listeMI[0]) {
    try {
      const r = await axios.get(base + "/agents-rh/" + listeMI[0].agent_id, { headers: { Authorization: "Bearer " + tokenMI } });
      console.log("Statut: " + r.status + " - acces reussi (attendu)");
    } catch (e) {
      console.log("PROBLEME : statut " + (e.response ? e.response.status : e.message));
    }
  } else {
    console.log("MI n a aucun agent existant a tester - creons-en un dans son perimetre");
    const resArboMI = await axios.get(base + "/postes/arborescence", { headers: { Authorization: "Bearer " + tokenMI } });
    const instMI = resArboMI.data.data[0];
    try {
      const r = await axios.post(base + "/agents-rh", {
        nom: "TestScope", prenom: "Agent", date_naissance: "1990-01-01",
        matricule: "TESTSCOPE01", sexe: "M", institution_id: instMI.institution_id
      }, { headers: { Authorization: "Bearer " + tokenMI } });
      console.log("Statut creation dans son perimetre: " + r.status + " (attendu 201)");
    } catch (e) {
      console.log("Statut: " + (e.response ? e.response.status : e.message) + " - " + (e.response ? JSON.stringify(e.response.data) : ""));
    }
  }

  console.log("`n===== 5. MI tente de creer un agent sur une institution hors perimetre - DOIT renvoyer 403 =====");
  const resArboPR = await axios.get(base + "/postes/arborescence", { headers: { Authorization: "Bearer " + tokenPR } });
  const instPresidence = resArboPR.data.data.find(i => i.nom.includes("sidence"));
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

  process.exit(0);
})().catch(e => { console.error("ERREUR FATALE:", e.message); process.exit(1); });
