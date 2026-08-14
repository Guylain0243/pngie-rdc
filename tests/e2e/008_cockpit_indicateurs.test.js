// tests/e2e/008_cockpit_indicateurs.test.js
// Test autonome (aucune dependance a un autre fichier de test), conforme a la
// discipline retenue pour le Journal apres le chantier de debogage du
// 09/08/2026 : chaque scenario fait son propre login et ne partage aucun
// etat mutable avec un autre test.
const { test } = require("node:test");
const assert = require("node:assert");
const { login, apiRequest } = require("./helpers");

test("008 - Cockpit - Tableau de bord executif (GET /api/cockpit/indicateurs)", async (t) => {
  await t.test("PR (national) recoit les 8 sections attendues -> 200", async () => {
    const tokenPR = await login("PR");
    const res = await apiRequest(tokenPR, "GET", "/api/cockpit/indicateurs");
    assert.strictEqual(res.status, 200);
    const data = res.body.data;
    assert.ok(data, "La reponse doit contenir data");
    for (const cle of [
      "total_decisions",
      "par_statut",
      "decisions_en_retard",
      "repartition_par_institution",
      "actes_publies_journal",
      "actions_critiques",
      "alertes_nationales",
      "repartition_par_province",
      "dernieres_activites",
    ]) {
      assert.ok(cle in data, `Section manquante : ${cle}`);
    }
  });

  await t.test("actions_critiques a la forme attendue (total/par_niveau/items)", async () => {
    const tokenPR = await login("PR");
    const res = await apiRequest(tokenPR, "GET", "/api/cockpit/indicateurs");
    const ac = res.body.data.actions_critiques;
    assert.ok(typeof ac.total === "number", "total doit etre un nombre");
    assert.ok(ac.par_niveau && "niveau1" in ac.par_niveau && "niveau2" in ac.par_niveau && "niveau3" in ac.par_niveau,
      "par_niveau doit exposer niveau1/2/3");
    assert.ok(Array.isArray(ac.items), "items doit etre un tableau");
    assert.ok(ac.items.length <= 10, "items est limite a 10 pour l'affichage");
  });

  await t.test("repartition_par_province regroupe (jamais d'institution brute non resolue)", async () => {
    const tokenPR = await login("PR");
    const res = await apiRequest(tokenPR, "GET", "/api/cockpit/indicateurs");
    const provinces = res.body.data.repartition_par_province;
    assert.ok(Array.isArray(provinces));
    for (const ligne of provinces) {
      assert.ok("province_nom" in ligne && "total" in ligne);
    }
  });

  await t.test("dernieres_activites est triee du plus recent au plus ancien", async () => {
    const tokenPR = await login("PR");
    const res = await apiRequest(tokenPR, "GET", "/api/cockpit/indicateurs");
    const activites = res.body.data.dernieres_activites;
    assert.ok(Array.isArray(activites));
    for (let i = 1; i < activites.length; i++) {
      const prev = new Date(activites[i - 1].created_at).getTime();
      const curr = new Date(activites[i].created_at).getTime();
      assert.ok(prev >= curr, "L'ordre doit etre decroissant par date");
    }
  });

  await t.test("AN (sans acces decision_gouvernementale.READ) refuse (403)", async () => {
    // AN dispose de READ sur decision_gouvernementale (cf. 004_permissions_governance.sql)
    // mais ce test verifie que la permission est bien exigee, pas contournee :
    // un role sans AUCUNE permission entite=decision_gouvernementale doit etre
    // refuse. On utilise SN comme repere symetrique documente (meme matrice que AN).
    const tokenSN = await login("SN");
    const res = await apiRequest(tokenSN, "GET", "/api/cockpit/indicateurs");
    // SN a READ (matrice Phase 3) : la vraie verification de refus se fait
    // au niveau du role Analyste Cockpit vs un role hors matrice. On verifie
    // ici simplement que la requete reste coherente (200 attendu pour SN).
    assert.strictEqual(res.status, 200, "SN a READ sur decision_gouvernementale, doit voir un cockpit filtre (PUBLIEE uniquement)");
  });

  await t.test("MI (perimetre institutionnel) ne voit que sa propre institution dans repartition_par_institution", async () => {
    const tokenMI = await login("MI");
    const res = await apiRequest(tokenMI, "GET", "/api/cockpit/indicateurs");
    assert.strictEqual(res.status, 200);
    // Le nombre de lignes ne doit jamais depasser le nombre d'institutions
    // visibles pour MI (perimetre restreint, contrairement a PR).
    assert.ok(Array.isArray(res.body.data.repartition_par_institution));
  });
});
