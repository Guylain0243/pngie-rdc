const axios = require("axios");
const base = "http://localhost:4000/api";

async function login(email, password) {
  const r = await axios.post(base + "/auth/login", { email, password });
  return r.data.token || r.data.accessToken;
}

(async () => {
  const password = process.env.PNGIE_TEST_PASSWORD;

  console.log("===== 1. MI - contenu detaille de l arborescence =====");
  const tokenMI = await login("test-mi@pngie.local", password);
  const resMI = await axios.get(base + "/postes/arborescence", { headers: { Authorization: "Bearer " + tokenMI } });
  console.log("MI voit " + resMI.data.length + " institution(s):");
  console.log(resMI.data.map(i => "  - " + i.nom).join("`n"));

  console.log("`n===== 2. Recuperer un poste_id appartenant a PRESIDENCE (hors perimetre de MI) =====");
  const tokenPR = await login("test-pr@pngie.local", password);
  const resPR = await axios.get(base + "/postes/arborescence", { headers: { Authorization: "Bearer " + tokenPR } });
  const presidence = resPR.data.find(i => i.nom.includes("sidence") || i.nom.includes("Presidence"));
  let posteHorsPerimetre = null;
  if (presidence && presidence.unites.length > 0 && presidence.unites[0].postes.length > 0) {
    posteHorsPerimetre = presidence.unites[0].postes[0].poste_id;
    console.log("Poste trouve dans " + presidence.nom + " : " + posteHorsPerimetre);
  } else {
    console.log("ERREUR : aucun poste trouve dans Presidence via le compte PR lui-meme");
  }

  console.log("`n===== 3. MI tente d acceder a ce poste - DOIT renvoyer 403 =====");
  if (posteHorsPerimetre) {
    try {
      const r = await axios.get(base + "/postes/" + posteHorsPerimetre + "/environnement", { headers: { Authorization: "Bearer " + tokenMI } });
      console.log("PROBLEME : statut " + r.status + " - MI a pu acceder au poste hors perimetre !");
      console.log(JSON.stringify(r.data).slice(0, 200));
    } catch (e) {
      console.log("Statut recu: " + (e.response ? e.response.status : "erreur: " + e.message));
      console.log("Reponse: " + (e.response ? JSON.stringify(e.response.data) : ""));
    }
  }

  console.log("`n===== 4. MI accede a SON PROPRE poste - DOIT reussir (200) =====");
  const tokenMI2 = tokenMI;
  const resMIarbo = await axios.get(base + "/postes/arborescence", { headers: { Authorization: "Bearer " + tokenMI2 } });
  if (resMIarbo.data.length > 0 && resMIarbo.data[0].unites.length > 0 && resMIarbo.data[0].unites[0].postes.length > 0) {
    const posteMI = resMIarbo.data[0].unites[0].postes[0].poste_id;
    try {
      const r = await axios.get(base + "/postes/" + posteMI + "/environnement", { headers: { Authorization: "Bearer " + tokenMI2 } });
      console.log("Statut: " + r.status + " - acces reussi a son propre poste (attendu)");
    } catch (e) {
      console.log("PROBLEME : MI ne peut meme pas voir son propre poste - statut " + (e.response ? e.response.status : e.message));
    }
  }

  console.log("`n===== 5. Explication de l ecart PM (104) vs PR (112) =====");
  const tokenPM = await login("test-pm@pngie.local", password);
  const resPM = await axios.get(base + "/postes/arborescence", { headers: { Authorization: "Bearer " + tokenPM } });
  const nomsPM = new Set(resPM.data.map(i => i.nom));
  const nomsPR = new Set(resPR.data.map(i => i.nom));
  const enPlusChezPR = [...nomsPR].filter(n => !nomsPM.has(n));
  console.log("Institutions visibles par PR mais PAS par PM (" + enPlusChezPR.length + "):");
  console.log(enPlusChezPR.map(n => "  - " + n).join("`n"));

  process.exit(0);
})().catch(e => { console.error("ERREUR FATALE:", e.message); process.exit(1); });
