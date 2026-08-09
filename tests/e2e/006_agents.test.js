const { test } = require("node:test");
const assert = require("node:assert");
const { login, apiRequest } = require("./helpers");

const AGENT_ID = "6660d7d9-b855-4ca6-966a-4e622c8de64b"; // TestScope Agent, MIN_9
const INSTITUTION_MIN9_ID = "27303992-29ff-477f-b7d2-20101b9502e7"; // MIN_0 (Interieur), corrige le 08/08/2026 pour MI
const INSTITUTION_MIN2_ID = "061cbc50-a582-44d9-8c9c-31b25debe98d"; // Affaires Etrangeres
const AGENT_INEXISTANT_ID = "00000000-0000-0000-0000-000000000000";

let createdAgentId = null;

test("006 - Agents RH", async (t) => {

  t.after(async () => {
    if (createdAgentId) {
      const token = await login("MI");
      await apiRequest(token, "DELETE", `/api/agents-rh/${createdAgentId}`);
    }
  });

  // --- GET /agents-rh (liste) ---
  await t.test("MI voit la liste des agents (200)", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "GET", "/api/agents-rh");
    assert.strictEqual(res.status, 200);
  });

  await t.test("PM voit la liste (READ seul) (200)", async () => {
    const token = await login("PM");
    const res = await apiRequest(token, "GET", "/api/agents-rh");
    assert.strictEqual(res.status, 200);
  });

  await t.test("AN refuse (403) sur la liste", async () => {
    const token = await login("AN");
    const res = await apiRequest(token, "GET", "/api/agents-rh");
    assert.strictEqual(res.status, 403);
  });

  await t.test("GV refuse (403) sur la liste", async () => {
    const token = await login("GV");
    const res = await apiRequest(token, "GET", "/api/agents-rh");
    assert.strictEqual(res.status, 403);
  });

  await t.test("SN refuse (403) sur la liste", async () => {
    const token = await login("SN");
    const res = await apiRequest(token, "GET", "/api/agents-rh");
    assert.strictEqual(res.status, 403);
  });

  // --- GET /agents-rh/:id ---
  await t.test("MI voit l'agent de son perimetre (200)", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "GET", `/api/agents-rh/${AGENT_ID}`);
    assert.strictEqual(res.status, 200);
  });

  await t.test("PR (perimetre national) voit l'agent (200)", async () => {
    const token = await login("PR");
    const res = await apiRequest(token, "GET", `/api/agents-rh/${AGENT_ID}`);
    assert.strictEqual(res.status, 200);
  });

  await t.test("404 si agent inexistant", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "GET", `/api/agents-rh/${AGENT_INEXISTANT_ID}`);
    assert.strictEqual(res.status, 404);
  });

  // --- POST /agents-rh ---
  await t.test("PM refuse (403) la creation (READ seul)", async () => {
    const token = await login("PM");
    const res = await apiRequest(token, "POST", "/api/agents-rh", {
      nom: "E2E",
      prenom: "TestAgent006",
      date_naissance: "1990-01-01",
      matricule: "E2E-TEST-006",
      sexe: "M",
      institution_id: INSTITUTION_MIN9_ID
    });
    assert.strictEqual(res.status, 403);
  });

  await t.test("MI cree un agent dans son perimetre (201)", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "POST", "/api/agents-rh", {
      nom: "E2E",
      prenom: "TestAgent006",
      date_naissance: "1990-01-01",
      matricule: "E2E-TEST-006",
      sexe: "M",
      institution_id: INSTITUTION_MIN9_ID
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.data.agent_id);
    createdAgentId = res.body.data.agent_id;
  });

  await t.test("MI refuse (403) creation hors perimetre (institution MIN_2)", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "POST", "/api/agents-rh", {
      nom: "E2E",
      prenom: "TestAgentHorsPerimetre",
      date_naissance: "1990-01-01",
      matricule: "E2E-TEST-006-BIS",
      sexe: "F",
      institution_id: INSTITUTION_MIN2_ID
    });
    assert.strictEqual(res.status, 403);
  });

  await t.test("MI refuse (409) creation avec matricule deja utilise", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "POST", "/api/agents-rh", {
      nom: "E2E",
      prenom: "Duplicate",
      date_naissance: "1990-01-01",
      matricule: "E2E-TEST-006",
      sexe: "M",
      institution_id: INSTITUTION_MIN9_ID
    });
    assert.strictEqual(res.status, 409);
  });

  // --- PUT /agents-rh/:id ---
  await t.test("MI modifie l'agent cree (200)", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "PUT", `/api/agents-rh/${createdAgentId}`, {
      nom: "E2E",
      prenom: "TestAgent006Modifie",
      date_naissance: "1990-01-01",
      matricule: "E2E-TEST-006",
      sexe: "M",
      institution_id: INSTITUTION_MIN9_ID
    });
    assert.strictEqual(res.status, 200);
  });

  await t.test("PM refuse (403) la modification (READ seul)", async () => {
    const token = await login("PM");
    const res = await apiRequest(token, "PUT", `/api/agents-rh/${createdAgentId}`, {
      nom: "E2E",
      prenom: "TestAgent006",
      date_naissance: "1990-01-01",
      matricule: "E2E-TEST-006",
      sexe: "M",
      institution_id: INSTITUTION_MIN9_ID
    });
    assert.strictEqual(res.status, 403);
  });

  await t.test("MI refuse (403) modification vers institution hors perimetre", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "PUT", `/api/agents-rh/${createdAgentId}`, {
      nom: "E2E",
      prenom: "TestAgent006",
      date_naissance: "1990-01-01",
      matricule: "E2E-TEST-006",
      sexe: "M",
      institution_id: INSTITUTION_MIN2_ID
    });
    assert.strictEqual(res.status, 403);
  });

  // --- GET /agents-rh/:id/historique ---
  await t.test("MI consulte l'historique de l'agent cree (200)", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "GET", `/api/agents-rh/${createdAgentId}/historique`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  // --- DELETE /agents-rh/:id ---
  await t.test("PM refuse (403) la suppression (READ seul)", async () => {
    const token = await login("PM");
    const res = await apiRequest(token, "DELETE", `/api/agents-rh/${createdAgentId}`);
    assert.strictEqual(res.status, 403);
  });

  await t.test("MI supprime l'agent cree (204)", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "DELETE", `/api/agents-rh/${createdAgentId}`);
    assert.strictEqual(res.status, 204);
    createdAgentId = null;
  });

  await t.test("404 si suppression agent inexistant", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "DELETE", `/api/agents-rh/${AGENT_INEXISTANT_ID}`);
    assert.strictEqual(res.status, 404);
  });
});
