const { test } = require("node:test");
const assert = require("node:assert");
const { login, apiRequest } = require("./helpers");

// Poste libre MIN_9 (aucune affectation active) - utilise pour creation/suppression
const POSTE_LIBRE_MIN9_ID = "b13e1fc6-0f62-4398-b1f6-5a52d234c514";
// Personne neutre, sans lien avec les comptes de test ni MIN_9/MIN_2
const PERSONNE_NEUTRE_ID = "edbf2003-d3ac-4102-aa18-ef0488a70018";

// Affectations existantes
const AFFECTATION_MIN9_ID = "e7c3a296-f81b-4906-8b77-b0bea6ac4848"; // Ministre, MIN_9, TITULAIRE
const AFFECTATION_MIN2_ID = "f59cee7f-2065-4e91-8603-d2dd65355a14"; // Ministre, MIN_2, TITULAIRE
const POSTE_MIN9_DEJA_POURVU_ID = "b409eec0-f131-4dfe-8300-445c93c1942c"; // poste de AFFECTATION_MIN9_ID
const AFFECTATION_INEXISTANTE_ID = "00000000-0000-0000-0000-000000000000";

let createdAffectationId = null;

test("005 - Affectations", async (t) => {

  t.after(async () => {
    if (createdAffectationId) {
      const token = await login("MI");
      await apiRequest(token, "DELETE", `/api/affectations/${createdAffectationId}`);
    }
  });

  // --- GET /affectations (liste) ---
  await t.test("MI voit la liste des affectations (200)", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "GET", "/api/affectations");
    assert.strictEqual(res.status, 200);
  });

  await t.test("PM voit la liste (READ seul) (200)", async () => {
    const token = await login("PM");
    const res = await apiRequest(token, "GET", "/api/affectations");
    assert.strictEqual(res.status, 200);
  });

  await t.test("AN refuse (403) sur la liste", async () => {
    const token = await login("AN");
    const res = await apiRequest(token, "GET", "/api/affectations");
    assert.strictEqual(res.status, 403);
  });

  await t.test("GV refuse (403) sur la liste", async () => {
    const token = await login("GV");
    const res = await apiRequest(token, "GET", "/api/affectations");
    assert.strictEqual(res.status, 403);
  });

  await t.test("SN refuse (403) sur la liste", async () => {
    const token = await login("SN");
    const res = await apiRequest(token, "GET", "/api/affectations");
    assert.strictEqual(res.status, 403);
  });

  // --- GET /affectations/:id ---
  await t.test("MI voit une affectation de son perimetre (MIN_9) (200)", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "GET", `/api/affectations/${AFFECTATION_MIN9_ID}`);
    assert.strictEqual(res.status, 200);
  });

  await t.test("MI refuse (403) hors perimetre sur affectation MIN_2", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "GET", `/api/affectations/${AFFECTATION_MIN2_ID}`);
    assert.strictEqual(res.status, 403);
  });

  await t.test("PR (perimetre national) voit l'affectation MIN_2 (200)", async () => {
    const token = await login("PR");
    const res = await apiRequest(token, "GET", `/api/affectations/${AFFECTATION_MIN2_ID}`);
    assert.strictEqual(res.status, 200);
  });

  await t.test("404 si affectation inexistante", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "GET", `/api/affectations/${AFFECTATION_INEXISTANTE_ID}`);
    assert.strictEqual(res.status, 404);
  });

  // --- POST /affectations ---
  await t.test("PM refuse (403) la creation (READ seul)", async () => {
    const token = await login("PM");
    const res = await apiRequest(token, "POST", "/api/affectations", {
      personne_id: PERSONNE_NEUTRE_ID,
      poste_id: POSTE_LIBRE_MIN9_ID,
      type_affectation: "MISSION",
      date_debut: "2026-01-01"
    });
    assert.strictEqual(res.status, 403);
  });

  await t.test("MI cree une affectation sur un poste libre de son perimetre (201)", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "POST", "/api/affectations", {
      personne_id: PERSONNE_NEUTRE_ID,
      poste_id: POSTE_LIBRE_MIN9_ID,
      type_affectation: "MISSION",
      date_debut: "2026-01-01"
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.data.affectation_id);
    createdAffectationId = res.body.data.affectation_id;
  });

  await t.test("MI refuse (409) creation TITULAIRE sur poste deja pourvu", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "POST", "/api/affectations", {
      personne_id: PERSONNE_NEUTRE_ID,
      poste_id: POSTE_MIN9_DEJA_POURVU_ID,
      type_affectation: "TITULAIRE",
      date_debut: "2026-01-01"
    });
    assert.strictEqual(res.status, 409);
  });

  await t.test("MI refuse (403) creation hors perimetre (poste MIN_2)", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "POST", "/api/affectations", {
      personne_id: PERSONNE_NEUTRE_ID,
      poste_id: "04b42a20-327a-4a88-b99b-a409e413402e",
      type_affectation: "MISSION",
      date_debut: "2026-01-01"
    });
    assert.strictEqual(res.status, 403);
  });

  // --- PUT /affectations/:id ---
  await t.test("MI modifie l'affectation creee (200)", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "PUT", `/api/affectations/${createdAffectationId}`, {
      personne_id: PERSONNE_NEUTRE_ID,
      poste_id: POSTE_LIBRE_MIN9_ID,
      type_affectation: "MISSION",
      date_debut: "2026-01-01",
      texte_nomination: "Mise a jour test E2E"
    });
    assert.strictEqual(res.status, 200);
  });

  await t.test("PM refuse (403) la modification (READ seul)", async () => {
    const token = await login("PM");
    const res = await apiRequest(token, "PUT", `/api/affectations/${createdAffectationId}`, {
      personne_id: PERSONNE_NEUTRE_ID,
      poste_id: POSTE_LIBRE_MIN9_ID,
      type_affectation: "MISSION",
      date_debut: "2026-01-01"
    });
    assert.strictEqual(res.status, 403);
  });

  // --- DELETE /affectations/:id ---
  await t.test("PM refuse (403) la suppression (READ seul)", async () => {
    const token = await login("PM");
    const res = await apiRequest(token, "DELETE", `/api/affectations/${createdAffectationId}`);
    assert.strictEqual(res.status, 403);
  });

  await t.test("MI supprime l'affectation creee (204)", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "DELETE", `/api/affectations/${createdAffectationId}`);
    assert.strictEqual(res.status, 204);
    createdAffectationId = null; // deja supprimee, evite une double suppression dans t.after
  });

  await t.test("404 si suppression affectation inexistante", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "DELETE", `/api/affectations/${AFFECTATION_INEXISTANTE_ID}`);
    assert.strictEqual(res.status, 404);
  });
});
