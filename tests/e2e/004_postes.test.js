const { test } = require("node:test");
const assert = require("node:assert");
const { login, apiRequest, resolvePosteByCode } = require("./helpers");

// Poste "Ministre" - unite_id de MIN_9 (Transports), institution de MI
let POSTE_MIN9_ID;
// Poste "Directeur General des Organisations Internationales" - institution MIN_2 (Affaires Etrangeres)
// Hors du perimetre de tous les comptes de test sauf PR (national)
let POSTE_MIN2_ID;
const POSTE_INEXISTANT_ID = "00000000-0000-0000-0000-000000000000";

test("004 - Postes (arborescence + environnement)", async (t) => {
  POSTE_MIN9_ID = await resolvePosteByCode("POSTE-POURVU");
  POSTE_MIN2_ID = await resolvePosteByCode("POSTE-MIN2-A");


  // --- /postes/arborescence : tous les roles ont READ sur unite_organisationnelle ---
  await t.test("MI voit l'arborescence (200)", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "GET", "/api/postes/arborescence");
    assert.strictEqual(res.status, 200);
  });

  await t.test("PM voit l'arborescence (200)", async () => {
    const token = await login("PM");
    const res = await apiRequest(token, "GET", "/api/postes/arborescence");
    assert.strictEqual(res.status, 200);
  });

  await t.test("PR voit l'arborescence (200)", async () => {
    const token = await login("PR");
    const res = await apiRequest(token, "GET", "/api/postes/arborescence");
    assert.strictEqual(res.status, 200);
  });

  await t.test("AN voit l'arborescence (200) - permission ok, scope filtre le contenu", async () => {
    const token = await login("AN");
    const res = await apiRequest(token, "GET", "/api/postes/arborescence");
    assert.strictEqual(res.status, 200);
  });

  await t.test("GV voit l'arborescence (200)", async () => {
    const token = await login("GV");
    const res = await apiRequest(token, "GET", "/api/postes/arborescence");
    assert.strictEqual(res.status, 200);
  });

  await t.test("SN voit l'arborescence (200)", async () => {
    const token = await login("SN");
    const res = await apiRequest(token, "GET", "/api/postes/arborescence");
    assert.strictEqual(res.status, 200);
  });

  // --- /postes/:id/environnement : controle de perimetre en plus de la permission ---
  await t.test("MI voit l'environnement de son propre poste (MIN_9) (200)", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "GET", `/api/postes/${POSTE_MIN9_ID}/environnement`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.poste.poste_id, POSTE_MIN9_ID);
  });

  await t.test("PR (perimetre national) voit l'environnement d'un poste MIN_9 (200)", async () => {
    const token = await login("PR");
    const res = await apiRequest(token, "GET", `/api/postes/${POSTE_MIN9_ID}/environnement`);
    assert.strictEqual(res.status, 200);
  });

  await t.test("PR (perimetre national) voit l'environnement d'un poste MIN_2 (200)", async () => {
    const token = await login("PR");
    const res = await apiRequest(token, "GET", `/api/postes/${POSTE_MIN2_ID}/environnement`);
    assert.strictEqual(res.status, 200);
  });

  await t.test("AN refuse (403) hors perimetre sur poste MIN_2", async () => {
    const token = await login("AN");
    const res = await apiRequest(token, "GET", `/api/postes/${POSTE_MIN2_ID}/environnement`);
    assert.strictEqual(res.status, 403);
  });

  await t.test("AN refuse (403) hors perimetre sur poste MIN_9", async () => {
    const token = await login("AN");
    const res = await apiRequest(token, "GET", `/api/postes/${POSTE_MIN9_ID}/environnement`);
    assert.strictEqual(res.status, 403);
  });

  await t.test("MI refuse (403) hors perimetre sur poste MIN_2", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "GET", `/api/postes/${POSTE_MIN2_ID}/environnement`);
    assert.strictEqual(res.status, 403);
  });

  await t.test("404 si poste inexistant", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "GET", `/api/postes/${POSTE_INEXISTANT_ID}/environnement`);
    assert.strictEqual(res.status, 404);
  });
});
