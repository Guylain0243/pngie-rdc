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
  const listeMI = resListe.data.data;
  console.log("MI voit " + listeMI.length + " affectation(s):");
  console.log(listeMI.map(a => "  - " + a.personne_nom + " sur poste " + a.poste_intitule).join("`n"));

  console.log("`n===== 2. PR - liste des affectations visibles =====");
  const tokenPR = await login("test-pr@pngie.local", password);
  const resListePR = await axios.get(base + "/affectations", { headers: { Authorization: "Bearer " + tokenPR } });
  const listePR = resListePR.data.data;
  console.log("PR voit " + listePR.length + " affectation(s)");

  console.log("`n===== 3. MI tente de lire une affectation de PR (hors perimetre) - DOIT renvoyer 403 =====");
  const cible = listePR.find(a => !listeMI.some(m => m.affectation_id === a.affectation_id));
  console.log("Affectation ciblee: " + (cible ? cible.affectation_id + " (" + cible.personne_nom + ")" : "AUCUNE trouvee - toutes deja visibles par MI ?"));
  if (cible) {
    try {
      const r = await axios.get(base + "/affectations/" + cible.affectation_id, { headers: { Authorization: "Bearer " + tokenMI } });
      console.log("PROBLEME : statut " + r.status + " - acces reussi alors qu il devrait etre bloque");
    } catch (e) {
      console.log("Statut recu: " + (e.response ? e.response.status : e.message));
      console.log("Reponse: " + (e.response ? JSON.stringify(e.response.data) : ""));
    }
  }

  console.log("`n===== 4. MI accede a SA PROPRE affectation - DOIT reussir (200) =====");
  const propreMI = listeMI[0];
  if (propreMI) {
    try {
      const r = await axios.get(base + "/affectations/" + propreMI.affectation_id, { headers: { Authorization: "Bearer " + tokenMI } });
      console.log("Statut: " + r.status + " - acces reussi (attendu)");
    } catch (e) {
      console.log("PROBLEME : MI ne peut pas voir sa propre affectation - statut " + (e.response ? e.response.status : e.message));
    }
  }

  console.log("`n===== 5. MI tente de creer une affectation sur un poste hors perimetre - DOIT renvoyer 403 =====");
  const resArboPR = await axios.get(base + "/postes/arborescence", { headers: { Authorization: "Bearer " + tokenPR } });
  const arboData = resArboPR.data.data || resArboPR.data;
  const instPresidence = arboData.find(i => i.nom.includes("sidence"));
  const posteCible = instPresidence && instPresidence.unites[0] && instPresidence.unites[0].postes[0];
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
  } else {
    console.log("Aucun poste Presidence trouve pour le test");
  }

  process.exit(0);
})().catch(e => { console.error("ERREUR FATALE:", e.message); process.exit(1); });
