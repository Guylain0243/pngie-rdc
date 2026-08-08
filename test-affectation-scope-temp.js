const axios = require("axios");
const base = "http://localhost:4000/api";

async function login(email, password) {
  const r = await axios.post(base + "/auth/login", { email, password });
  return r.data.token || r.data.accessToken;
}

(async () => {
  const password = process.env.PNGIE_TEST_PASSWORD;

  console.log("===== 1. MI - liste des affectations visibles =====");
  const tokenMI = await login("test-mi@pngie.local", password);
  const resListe = await axios.get(base + "/affectations", { headers: { Authorization: "Bearer " + tokenMI } });
  console.log("MI voit " + resListe.data.length + " affectation(s)");

  console.log("`n===== 2. Recuperer une affectation de PRESIDENCE (hors perimetre de MI) =====");
  const tokenPR = await login("test-pr@pngie.local", password);
  const resListePR = await axios.get(base + "/affectations", { headers: { Authorization: "Bearer " + tokenPR } });
  console.log("PR voit " + resListePR.data.length + " affectation(s) au total");
  const affectationHorsPerimetre = resListePR.data.find(a => a.personne_nom && a.personne_nom.includes("PR"));
  if (!affectationHorsPerimetre) {
    console.log("Aucune affectation de test PR trouvee dans la liste - recherche par nom generique");
  }
  const cible = resListePR.data[0];
  console.log("Affectation ciblee pour le test: " + (cible ? cible.affectation_id : "AUCUNE"));

  console.log("`n===== 3. MI tente de lire cette affectation - DOIT renvoyer 403 =====");
  if (cible) {
    try {
      const r = await axios.get(base + "/affectations/" + cible.affectation_id, { headers: { Authorization: "Bearer " + tokenMI } });
      console.log("PROBLEME : statut " + r.status + " - acces reussi alors qu il devrait etre bloque");
    } catch (e) {
      console.log("Statut recu: " + (e.response ? e.response.status : e.message));
      console.log("Reponse: " + (e.response ? JSON.stringify(e.response.data) : ""));
    }
  }

  console.log("`n===== 4. MI tente de creer une affectation sur un poste PRESIDENCE - DOIT renvoyer 403 =====");
  const resArboPR = await axios.get(base + "/postes/arborescence", { headers: { Authorization: "Bearer " + tokenPR } });
  const posteCible = resArboPR.data[0] && resArboPR.data[0].unites[0] && resArboPR.data[0].unites[0].postes[0];
  if (posteCible) {
    try {
      const r = await axios.post(base + "/affectations", {
        personne_id: "00000000-0000-0000-0000-000000000000",
        poste_id: posteCible.poste_id,
        type_affectation: "MISSION",
        date_debut: "2026-01-01"
      }, { headers: { Authorization: "Bearer " + tokenMI } });
      console.log("PROBLEME : statut " + r.status + " - creation reussie alors qu elle devrait etre bloquee");
    } catch (e) {
      console.log("Statut recu: " + (e.response ? e.response.status : e.message));
      console.log("Reponse: " + (e.response ? JSON.stringify(e.response.data) : ""));
    }
  }

  process.exit(0);
})().catch(e => { console.error("ERREUR FATALE:", e.message); process.exit(1); });
